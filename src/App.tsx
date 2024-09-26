import React, {
	useState,
	createContext,
	// useContext,
	useEffect,
} from "react";

import "./App.css";
import {
	Tldraw,
	// TLComponents,
	TLBaseShape,
	// HTMLContainer,
	ShapeUtil,
	Rectangle2d,
	track,
	useEditor,
	Editor,
	createShapeId,
	TLShapeUtilCanBindOpts,
	TLShapeId,
	TLRecord,
	useToasts,
	TLUiIconType,
	TLComponents,
	// DefaultQuickActions,
	TldrawUiMenuItem,
	DefaultToolbarContent,
	// useIsToolSelected,
	// useTools,
	DefaultToolbar,
	// DefaultQuickActionsContent,
	// TLOnBeforeUpdateHandler,
} from "tldraw";
import "tldraw/tldraw.css";
import {
	fetchCosineSim,
	fetchDescriptions,
	fetchSearchResults,
	fetchTopActions,
	fetchTopEffects,
	fetchCoOccurringEffects,
	// fetchActivations,
	fetchCosineSimEffects,
	// MIN_CARD_HEIGHT,
} from "./utils";
import { Retrieval, RETRIEVAL_TYPES } from "./types";

// Create a context for the feature number
const FeatureContext = createContext<
	| {
			featureNumber: number;
			setFeatureNumber: React.Dispatch<React.SetStateAction<number>>;
	  }
	| undefined
>(undefined);

// Create a context for the search query
const SearchQueryContext = createContext<
	| {
			searchQuery: string;
			setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
	  }
	| undefined
>(undefined);

// const CustomNavigationPanel = track(() => {
// 	const featureContext = useContext(FeatureContext);
// 	if (!featureContext)
// 		throw new Error("FeatureContext must be used within a FeatureProvider");
// 	const { featureNumber, setFeatureNumber } = featureContext;
// 	const [inputFeature, setInputFeature] = useState(featureNumber.toString());

// 	const handleSubmit = (e: React.FormEvent) => {
// 		e.preventDefault();
// 		const newFeature = parseInt(inputFeature);
// 		if (!isNaN(newFeature)) {
// 			setFeatureNumber(newFeature);
// 		}
// 	};

// 	return (
// 		<div>
// 			<div>
// 				<form onSubmit={handleSubmit}>
// 					<input
// 						type="text"
// 						value={inputFeature}
// 						onChange={(e) => setInputFeature(e.target.value)}
// 						placeholder="Enter feature number"
// 					/>
// 					<button type="submit">Update</button>
// 				</form>
// 			</div>
// 			<iframe
// 				src={`https://neuronpedia.org/gemma-2b/6-res-jb/${featureNumber}?embed=true`}
// 				title="Neuronpedia"
// 				className="neuronpedia-iframe"
// 				style={{
// 					pointerEvents: "auto",
// 					overflow: "auto",
// 					width: "400px",
// 					height: "400px",
// 					border: "1px solid lightgrey",
// 					borderTopRightRadius: "10px",
// 					boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
// 				}}
// 			></iframe>
// 		</div>
// 	);
// });

// const components: TLComponents = {
// 	NavigationPanel: CustomNavigationPanel, // null will hide the panel instead
// };

type PromptShape = TLBaseShape<
	"prompt",
	{
		w: number;
		h: number;
		text: string;
		activations: [value: number, feature: string][];
	}
>;

class PromptShapeUtil extends ShapeUtil<PromptShape> {
	static override type = "prompt" as const;

	getDefaultProps() {
		return {
			w: 250,
			h: 100,
			text: "",
			activations: [],
		};
	}

	getGeometry(shape: PromptShape) {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		});
	}

	override canBind({}: TLShapeUtilCanBindOpts<PromptShape>) {
		// Allow pins to participate in other bindings, e.g. arrows
		return true;
	}

	component(shape: PromptShape) {
		return (
			<div
				ref={() => {
					// if (el) {
					// 	const newHeight = el.getBoundingClientRect().height;
					// 	if (newHeight !== shape.props.h) {
					// 		// Update the shape's height in the editor
					// 		this.editor?.updateShape({
					// 			id: shape.id,
					// 			type: "card",
					// 			props: {
					// 				...shape.props,
					// 				h: newHeight,
					// 			},
					// 		});
					// 	}
					// }
				}}
				className="card-container"
				style={{
					pointerEvents: "all",
					minHeight: "100px",
				}}
			>
				<h2
					style={{
						margin: 0,
						color: "grey",
					}}
				>
					Prompt
				</h2>
				{shape.props.activations.length === 0
					? shape.props.text
					: shape.props.activations.map((activation) => {
							return (
								<>
									<span
										style={{
											backgroundColor: `rgba(0, 100, 255, ${Math.min(
												Number(activation[1]) / 60,
												1
											)})`,
											display: "inline-block",
										}}
										title={activation[1]}
										data-tooltip={activation[1]}
									>
										{activation[0]}
									</span>
								</>
							);
					  })}
			</div>
		);
	}

	indicator(shape: PromptShape) {
		return (
			<rect
				style={{ borderRadius: "3px" }}
				width={shape.props.w}
				height={shape.props.h}
			/>
		);
	}
}

//
type CardShape = TLBaseShape<
	"card",
	{
		w: number;
		h: number;
		feature: string;
		description: string;
		fromFeature: string;
		score: number | null;
		type: string;
		hovered: boolean;
	}
>;

class CardShapeUtil extends ShapeUtil<CardShape> {
	// @ts-ignore
	static override type = "card" as const;
	// private element: HTMLElement | null = null;
	// private measurementDone: boolean = false;

	getDefaultProps(): CardShape["props"] {
		return {
			w: 250,
			h: 100,
			feature: "10138",
			description: "related to London",
			fromFeature: "",
			score: null,
			type: "",
			hovered: false,
		};
	}

	getGeometry(shape: CardShape) {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		});
	}

	override canBind({}: TLShapeUtilCanBindOpts<CardShape>) {
		// Allow pins to participate in other bindings, e.g. arrows
		return true;
	}

	component(shape: CardShape) {
		return (
			<FeatureContext.Consumer>
				{(featureContext) => (
					<SearchQueryContext.Consumer>
						{(searchContext) => {
							if (!featureContext || !searchContext) {
								throw new Error(
									"FeatureContext and SearchQueryContext must be used within their respective providers"
								);
							}
							return (
								<div
									ref={() => {
										// if (el) {
										// 	const newHeight = el.getBoundingClientRect().height;
										// 	if (newHeight !== shape.props.h) {
										// 		// Update the shape's height in the editor
										// 		this.editor?.updateShape({
										// 			id: shape.id,
										// 			type: "card",
										// 			props: {
										// 				...shape.props,
										// 				h: newHeight,
										// 			},
										// 		});
										// 	}
										// }
										// setTimeout(() => {
										// 	console.log(shape.props.feature);
										// 	console.log(shape.props.description);
										// 	console.log(el?.getBoundingClientRect());
										// 	const height = el?.getBoundingClientRect().height;
										// 	this.editor?.updateShape({
										// 		id: shape.id,
										// 		type: "card",
										// 		props: {
										// 			...shape.props,
										// 			h: height ? height + 10 : 90,
										// 		},
										// 	});
										// }, 200);
										// this.element = el;
										// setTimeout(() => {
										// 	console.log("Feature: " + shape.props.feature);
										// 	console.log(el);
										// 	if (el && !this.measurementDone) {
										// 		const height = el.getBoundingClientRect().height;
										// 		// + 10 considers padding of parent element
										// 		const currentHeight = height + 10;
										// 		console.log(el);
										// 		console.log(el.getBoundingClientRect());
										// 		console.log("current height: " + currentHeight);
										// 		console.log("shape height: " + shape.props.h);
										// 		this.editor?.updateShape({
										// 			id: shape.id,
										// 			type: "card",
										// 			props: {
										// 				...shape.props,
										// 				h: Math.max(currentHeight, MIN_CARD_HEIGHT),
										// 			},
										// 		});
										// 		this.measurementDone = true;
										// 	}
										// }, 200);
									}}
									className="card-container"
									style={{
										pointerEvents: "all",
										minHeight: "100px",
										backgroundColor: shape.props.hovered
											? "lightgrey"
											: "white",
										position: "relative", // Add this to make absolute positioning work
									}}
								>
									<div className="card-row">
										<h2 style={{ margin: 0 }}>{shape.props.feature}</h2>
										<div
											className="card-preview"
											onClick={() => {
												featureContext.setFeatureNumber(
													Number(shape.props.feature)
												);
												searchContext.setSearchQuery(shape.props.description);
											}}
											onPointerDown={(e) => e.stopPropagation()}
											onTouchStart={(e) => e.stopPropagation()}
											onTouchEnd={(e) => e.stopPropagation()}
										>
											🔍
										</div>
										<div className="card-stats">
											<div>
												{shape.props.fromFeature !== ""
													? `${Number(shape.props.score)
															.toFixed(2)
															.replace(/^0\./, ".")} ${shape.props.type} for ${
															shape.props.fromFeature
													  }`
													: ""}
											</div>
										</div>
									</div>
									<span>{shape.props.description}</span>
									{/* <input
										type="range"
										min="0"
										max="100"
										defaultValue="50"
										style={{
											position: "absolute",
											right: "-65px",
											top: "50%",
											transform: "translateY(-50%) rotate(-90deg)",
											transformOrigin: "center",
											width: "100px",
											height: "20px",
										}}
										onPointerDown={(e) => e.stopPropagation()}
										onChange={(e) => {
											// Handle slider value change here
											console.log("Slider value:", e.target.value);
										}}
									/> */}
								</div>
							);
						}}
					</SearchQueryContext.Consumer>
				)}
			</FeatureContext.Consumer>
		);
	}

	indicator(shape: CardShape) {
		return (
			<rect
				style={{ borderRadius: "3px" }}
				width={shape.props.w}
				height={shape.props.h}
			/>
		);
	}
}

const customShape = [CardShapeUtil, PromptShapeUtil];

type ArrowDirection = "right" | "down" | "left" | "up";

const ArrowIcon = ({ direction = "right" }: { direction?: ArrowDirection }) => {
	const rotationDegrees = {
		right: 0,
		down: 90,
		left: 180,
		up: 270,
	};

	return (
		<svg
			width="16"
			height="16"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			style={{ transform: `rotate(${rotationDegrees[direction]}deg)` }}
		>
			<path
				d="M5 12H19M19 12L12 5M19 12L12 19"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
};
const CustomUi = track(() => {
	const editor = useEditor();
	const { addToast, removeToast } = useToasts();

	const createToast = ({
		title,
		description,
		icon = "dots-horizontal",
		severity = "info",
	}: {
		title: string;
		description: string;
		icon?: TLUiIconType;
		severity?: "info" | "error" | "success";
	}) => {
		return addToast({
			title: title,
			description: description,
			icon: icon,
			severity: severity,
			actions: [
				{
					label: "Dismiss",
					type: "normal",
					onClick: () => {
						console.log("Toast dismissed");
					},
				},
			],
		});
	};

	async function fetchDataForType(type: Retrieval, feature: string) {
		switch (type) {
			case RETRIEVAL_TYPES.EFFECTS:
				return fetchTopEffects(Number(feature));
			case RETRIEVAL_TYPES.COSINE_SIM:
				return fetchCosineSim(Number(feature));
			case RETRIEVAL_TYPES.CO_OCCURRING_EFFECTS:
				return fetchCoOccurringEffects(Number(feature));
			case RETRIEVAL_TYPES.ACTIONS:
				return fetchTopActions(Number(feature));
			case RETRIEVAL_TYPES.COSINE_SIM_EFFECTS:
				return fetchCosineSimEffects(Number(feature));
			default:
				return { indices: [], values: [] };
		}
	}

	function calculateCardPositions(
		type: Retrieval,
		shapeY: number,
		totalCards: number
	) {
		const totalHeight = totalCards * 130;
		return type === RETRIEVAL_TYPES.COSINE_SIM
			? shapeY + 180
			: shapeY - totalHeight / 2 + 65;
	}

	const addFeaturesToGraph = async (type: Retrieval) => {
		const selectedShapes = editor?.getSelectedShapeIds();
		if (!selectedShapes || selectedShapes.length !== 1) {
			const errorToastId = createToast({
				title: "Error",
				description: "Please select exactly one feature.",
				icon: "cross-2",
				severity: "error",
			});
			setTimeout(() => {
				removeToast(errorToastId);
			}, 3000);
			return;
		}
		const shape: CardShape | undefined = editor?.getShape(selectedShapes[0]);
		if (!shape || shape.type !== "card") {
			const errorToastId = createToast({
				title: "Error",
				description: "Selected item is not a feature.",
				icon: "cross-2",
				severity: "error",
			});
			setTimeout(() => {
				removeToast(errorToastId);
			}, 3000);
			return;
		}
		// Make call to get the data

		const topK = 10;

		const toastId = createToast({
			title: "Fetching",
			description: "Fetching " + type + " for " + shape.props.feature,
		});

		try {
			const { indices, values } = await fetchDataForType(
				type,
				shape.props.feature
			);

			if (type === RETRIEVAL_TYPES.CO_OCCURRING_EFFECTS) {
				return;
			}

			const descriptions = await fetchDescriptions(
				indices
					.slice(0, topK)
					.filter((featureNumber: number) => featureNumber >= 0)
			);

			let shapes: TLShapeId[] = [];

			if (type === RETRIEVAL_TYPES.COSINE_SIM) {
				editor?.createShapes([
					{
						id: createShapeId(),
						type: "text",
						x: shape.x,
						y: shape.y + 130, // Position the text below the card
						props: {
							// @ts-ignore
							text: `Cos Sim w/ ${shape.props.feature}`,
						},
					},
				]);
			}

			const features = indices
				.slice(0, topK)
				.filter((featureNumber: number) => featureNumber >= 0);

			const startY = calculateCardPositions(type, shape.y, features.length);

			removeToast(toastId);

			features.forEach((featureNumber: string, index: number) => {
				const id = createShapeId();
				const arrow_id = createShapeId();

				shapes.push(id);

				let newShapes = [
					{
						id: id,
						type: "card",
						x:
							shape.x +
							(type === RETRIEVAL_TYPES.EFFECTS
								? // @ts-ignore
								  shape.props.w + 300
								: type === RETRIEVAL_TYPES.COSINE_SIM
								? // @ts-ignore
								  0
								: // @ts-ignore
								  -300 - shape.props.w),
						y: startY + index * 130,
						props: {
							feature: featureNumber.toString(),
							description: descriptions[featureNumber]
								? descriptions[featureNumber]
								: "",
							fromFeature: shape.props.feature,
							score: values[index],
							type: type,
						},
					},
				];

				if (type !== RETRIEVAL_TYPES.COSINE_SIM) {
					newShapes.push({
						id: arrow_id,
						type: "arrow",
						x: 150,
						y: 150,
						isLocked: true,
						props: {
							// @ts-ignore
							text: Number(values[index]).toFixed(2).replace(/^0\./, "."),
						},
						meta: {
							fromId: shape.id,
							toId: id,
						},
					});
				}

				editor?.createShapes(newShapes);

				if (RETRIEVAL_TYPES.COSINE_SIM !== type) {
					editor.createBindings([
						{
							fromId: arrow_id,
							toId: type === RETRIEVAL_TYPES.EFFECTS ? selectedShapes[0] : id,
							type: "arrow",
							props: {
								terminal: "start",
								normalizedAnchor: { x: 1, y: 0.5 },
								isExact: false,
								isPrecise: true,
							},
						},
						{
							fromId: arrow_id,
							toId: type === RETRIEVAL_TYPES.EFFECTS ? id : selectedShapes[0],
							type: "arrow",
							props: {
								terminal: "end",
								normalizedAnchor: { x: 0, y: 0.5 },
								isExact: false,
								isPrecise: true,
							},
						},
					]);
				}
			});

			editor.setSelectedShapes(shapes);
			removeToast(toastId);
		} catch (error: any) {
			removeToast(toastId);
			const errorToastId = createToast({
				title: "Error",
				description: `Failed to fetch ${type} data: ${error.message}`,
				icon: "cross-2",
				severity: "error",
			});
			setTimeout(() => {
				removeToast(errorToastId);
			}, 3000);
		}
	};
	async function handleKeyDown(e: KeyboardEvent) {
		if (e.shiftKey) {
			const selectedShapes = editor?.getSelectedShapes();

			const steering = selectedShapes.filter((shape) => shape.type === "card");
			const prompt = selectedShapes.filter((shape) => shape.type === "prompt");

			switch (e.key) {
				case "J":
					console.log("Shift + j pressed");
					await addFeaturesToGraph(RETRIEVAL_TYPES.COSINE_SIM);
					break;
				case "U":
					console.log("Shift + U pressed");
					await addFeaturesToGraph(RETRIEVAL_TYPES.ACTIONS);
					break;
				case "I":
					console.log("Shift + I pressed");
					await addFeaturesToGraph(RETRIEVAL_TYPES.EFFECTS);
					break;
				// case "K":
				// 	console.log("Shift + k pressed");
				// 	await addFeaturesToGraph(RETRIEVAL_TYPES.CO_OCCURRING_EFFECTS);
				// 	break;
				// case "E":
				// 	console.log("Shift + e pressed");
				// 	await addFeaturesToGraph(RETRIEVAL_TYPES.COSINE_SIM_EFFECTS);
				// 	break;
				case "P":
					console.log("Shift + p pressed");
					// Add a success toast
					const promptToast = createToast({
						title: "Success",
						description: "This will eventually generate text",
						icon: "check",
						severity: "success",
					});
					setTimeout(() => {
						removeToast(promptToast);
					}, 3000);
					break;
				case "S":
					console.log("Shift + s pressed");

					if (prompt.length < 1) {
						createToast({
							title: "Error",
							description: "Please select a prompt.",
							icon: "cross-2",
							severity: "error",
						});
						return;
					}

					if (prompt.length > 1) {
						createToast({
							title: "Error",
							description: "Please select only one prompt.",
							icon: "cross-2",
							severity: "error",
						});
						return;
					}

					if (steering.length < 1) {
						createToast({
							title: "Error",
							description: "Please select at least one feature.",
							icon: "cross-2",
							severity: "error",
						});
						return;
					}

					// Create arrows from each feature to the prompt
					steering.forEach((featureShape) => {
						const arrow_id = createShapeId();

						editor?.createShapes([
							{
								id: arrow_id,
								type: "arrow",
								x: 150,
								y: 150,
								isLocked: true,
								props: {
									text: "", // You can add text here if needed
								},
								meta: {
									fromId: featureShape.id,
									toId: prompt[0].id,
								},
							},
						]);

						editor.createBindings([
							{
								fromId: arrow_id,
								toId: featureShape.id,
								type: "arrow",
								props: {
									terminal: "start",
									normalizedAnchor: { x: 1, y: 0.5 },
									isExact: false,
									isPrecise: true,
								},
							},
							{
								fromId: arrow_id,
								toId: prompt[0].id,
								type: "arrow",
								props: {
									terminal: "end",
									normalizedAnchor: { x: 0, y: 0.5 },
									isExact: false,
									isPrecise: true,
								},
							},
						]);
					});

					// Add a success toast
					const toastID = createToast({
						title: "Success",
						description: "Arrows created from features to prompt.",
						icon: "check",
						severity: "success",
					});
					setTimeout(() => {
						removeToast(toastID);
					}, 3000);

					break;
			}
		}
	}

	async function handleMouseDown(e: MouseEvent) {
		e.preventDefault();
		console.log("mouse down");
		const selectedShapes = editor?.getSelectedShapes();
		const allShapes = editor?.getCurrentPageShapeIds();
		console.log(allShapes);
		const allShapesData = [...allShapes]?.map((shapeId) =>
			editor?.getShape(shapeId)
		);
		if (selectedShapes.length == 1 && selectedShapes[0].type === "card") {
			allShapesData.forEach(async (shape) => {
				if (
					shape &&
					shape.type === "card" &&
					shape.id !== selectedShapes[0].id &&
					// @ts-ignore
					shape?.props.feature === selectedShapes[0].props.feature
				) {
					editor?.updateShape({
						id: shape.id,
						type: shape.type,
						props: {
							hovered: true,
						},
					});
				} else if (shape && shape.type === "card") {
					editor?.updateShape({
						id: shape.id,
						type: shape.type,
						props: {
							hovered: false,
						},
					});
				}

				// // show activation patterns on text
				// if (shape && shape.type === "prompt") {
				// 	console.log(shape);
				// 	const activations = await fetchActivations(
				// 		// @ts-ignore
				// 		selectedShapes[0].props.feature,
				// 		// @ts-ignore
				// 		shape.props.text
				// 	);
				// 	console.log(activations);
				// 	if (activations.length > 0) {
				// 		editor.updateShape({
				// 			id: shape.id,
				// 			type: shape.type,
				// 			props: {
				// 				activations: activations,
				// 			},
				// 		});
				// 	}
				// }
			});
		} else {
			allShapesData.forEach((shape) => {
				if (shape && shape.type === "card") {
					editor?.updateShape({
						id: shape.id,
						type: shape.type,
						props: {
							hovered: false,
						},
					});
				}

				// // show activation patterns on text
				// if (shape && shape.type === "prompt") {
				// 	editor.updateShape({
				// 		id: shape.id,
				// 		type: shape.type,
				// 		props: {
				// 			activations: [],
				// 		},
				// 	});
				// }
			});
		}
	}

	useEffect(() => {
		window.addEventListener("mousedown", handleMouseDown);
		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("mousedown", handleMouseDown);
		};
	});

	return (
		<div className="custom-layout">
			{/* <div className="custom-toolbar">
				<button
					className="custom-button"
					data-isactive={editor.getCurrentToolId() === "select"}
					onClick={() => editor.setCurrentTool("select")}
				>
					Select
				</button>
				<button
					className="custom-button"
					data-isactive={editor.getCurrentToolId() === "draw"}
					onClick={() => editor.setCurrentTool("draw")}
				>
					Pencil
				</button>
				<button
					className="custom-button"
					data-isactive={editor.getCurrentToolId() === "eraser"}
					onClick={() => editor.setCurrentTool("eraser")}
				>
					Eraser
				</button>
				<input type="text" />
			</div> */}
		</div>
	);
});

function CustomToolbar() {
	const editor = useEditor();
	// const tools = useTools();

	const [selected, setSelected] = useState(false);
	const [text, setText] = useState("");

	const handleSubmit = () => {
		// Add your submit logic here
		const { x, y, width, height } = editor.getViewportPageBounds();
		const centerX = x + width / 2 - 120;
		const centerY = y + height * 0.8;

		editor.createShapes([
			{
				id: createShapeId(),
				type: "prompt",
				x: centerX,
				y: centerY,
				props: {
					text,
				},
			},
		]);
		setText(""); // Clear the input after submission
		setSelected(false);
	};

	return (
		<div>
			<DefaultToolbar>
				<TldrawUiMenuItem
					id="code"
					icon="edit"
					onSelect={() => setSelected(!selected)}
				/>

				{selected && (
					<input
						type="text"
						value={text}
						autoFocus
						onChange={(e) => setText(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								handleSubmit();
							}
						}}
					/>
				)}
				<DefaultToolbarContent />
			</DefaultToolbar>
		</div>
	);
}

const components: TLComponents = {
	Toolbar: CustomToolbar,
};

function App() {
	const [featureNumber, setFeatureNumber] = useState(10138);
	const [searchQuery, setSearchQuery] = useState("");

	const [editor, setEditor] = useState<Editor | null>(null);

	const [inputFeature, setInputFeature] = useState(featureNumber.toString());

	// Search query
	const [searchResults, setSearchResults] = useState([]);
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [showSearchResults, setShowSearchResults] = useState(false);

	// const handleActivations = async () => {
	// 	const activations = await fetchActivations(10138, "London");
	// 	console.log(activations);
	// };

	// useEffect(() => {
	// 	handleActivations();
	// }, []);

	useEffect(() => {
		setInputFeature(featureNumber.toString());
	}, [featureNumber]);

	useEffect(() => {
		setShowSearchResults(
			isSearchFocused && searchResults && searchResults.length > 0
		);
	}, [searchResults, isSearchFocused]);

	useEffect(() => {
		const delayDebounceFn = setTimeout(async () => {
			if (searchQuery.trim().length < 2) {
				setSearchResults([]);
				return;
			}
			let results = await fetchSearchResults(searchQuery);
			setSearchResults(results.slice(0, 40));
		}, 300); // Debounce delay

		return () => clearTimeout(delayDebounceFn);
	}, [searchQuery]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const newFeature = parseInt(inputFeature);
		if (!isNaN(newFeature)) {
			setFeatureNumber(newFeature);
			setSearchQuery("");
		}
	};

	const createCard = async (feature: number) => {
		if (editor) {
			const { x, y, width, height } = editor.getViewportPageBounds();
			const topMiddleX = x + width / 2;
			const topY = y + height * 0.15; // Add some padding from the top

			const descriptions = await fetchDescriptions([feature]);
			const description =
				descriptions[feature.toString()] || "No description available";

			const newShapeId = createShapeId();

			editor.createShapes([
				{
					id: newShapeId,
					type: "card",
					x: topMiddleX,
					y: topY,
					props: {
						feature: feature.toString(),
						description,
					},
				},
			]);

			editor.setSelectedShapes([newShapeId]);
		}
	};

	useEffect(() => {
		if (editor) {
			const { width, height } = editor.getViewportPageBounds();
			const centerX = width / 2;
			const centerY = height / 2;

			editor.createShapes([
				{
					id: createShapeId(),
					type: "card",
					x: centerX,
					y: centerY,
					props: {
						feature: "10138",
						description: "locations, particularly related to London",
					},
				},
			]);
		}
	}, [editor]);

	return (
		<FeatureContext.Provider value={{ featureNumber, setFeatureNumber }}>
			<SearchQueryContext.Provider value={{ searchQuery, setSearchQuery }}>
				<div style={{ position: "fixed", inset: 0 }}>
					<Tldraw
						components={components}
						shapeUtils={customShape}
						onMount={(editor: Editor) => {
							editor.sideEffects.registerAfterDeleteHandler(
								"shape",
								(shape) => {
									if (shape.type === "card") {
										const shapeId = shape.id;

										const connections: TLRecord[] = editor.store
											.allRecords()
											.filter((item) => {
												// @ts-ignore
												return (
													item.meta.fromId == shapeId ||
													item.meta.toId == shapeId
												);
											});

										connections.forEach((connection: TLRecord) => {
											(editor as Editor).run(
												() => {
													// @ts-ignore
													editor.deleteShape(connection.id);
												},
												{ ignoreShapeLock: true }
											);
										});
									}

									editor.sideEffects.registerBeforeChangeHandler(
										"shape",
										(prev, next) => {
											if (next.type === "arrow" && prev.type === "arrow") {
												return prev;
											}
											return next;
										}
									);

									return;
								}
							);

							setEditor(editor);
						}}
					>
						<CustomUi />
					</Tldraw>
				</div>
				<div
					style={{
						position: "fixed",
						top: "446px",
						left: 4,
					}}
				>
					<div className="feature-controls">
						<div className="form-container">
							<form onSubmit={handleSubmit} className="input-container">
								<input
									className="feature-input"
									type="number"
									value={inputFeature}
									onChange={(e) => {
										setInputFeature(e.target.value);
									}}
									placeholder="Enter feature number"
								/>
								<button className="feature-submit" type="submit">
									<ArrowIcon direction="up" />
								</button>
							</form>

							<div className="search-container">
								<input
									className="search-input"
									type="text"
									placeholder="Search by description"
									style={{
										borderRadius: showSearchResults ? "4px 4px 0 0" : "4px",
									}}
									value={searchQuery}
									onFocus={async () => {
										const data = await fetchSearchResults(searchQuery);
										setSearchResults(data);
										setIsSearchFocused(true);
									}}
									onBlur={() => {
										setTimeout(() => setIsSearchFocused(false), 100);
									}}
									onChange={(e) => setSearchQuery(e.target.value)}
								/>
								{showSearchResults && (
									<div
										style={{
											borderRadius: showSearchResults ? "0 0 4px 4px" : "4px",
											marginTop: "-1px",
										}}
										className="search-results"
									>
										{searchResults.map((result, index) => (
											<div
												key={index}
												className="search-result-item"
												onMouseDown={() => {
													setFeatureNumber(result[1]);
													setInputFeature(result[1]);
													setSearchQuery(result[0]);
													setSearchResults([]);
												}}
											>
												<span className="result-number">{result[1]}</span>
												<span className="result-description">{result[0]}</span>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
				<iframe
					src={`https://neuronpedia.org/gemma-2b/6-res-jb/${featureNumber}?embed=true`}
					title="Neuronpedia"
					className="neuronpedia-iframe"
					style={{
						pointerEvents: "auto",
						overflow: "auto",
						width: "400px",
						height: "400px",
						border: "1px solid lightgrey",
						boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
						position: "fixed",
						top: 44,
						left: 4,
						borderTopLeftRadius: "4px",
						borderBottomLeftRadius: "4px",
					}}
				></iframe>
				<button
					className="insert-feature"
					onClick={() => createCard(featureNumber)}
				>
					<ArrowIcon />
				</button>
			</SearchQueryContext.Provider>
		</FeatureContext.Provider>
	);
}

export default App;
