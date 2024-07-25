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
	HTMLContainer,
	ShapeUtil,
	Rectangle2d,
	track,
	useEditor,
	Editor,
	createShapeId,
	TLShapeUtilCanBindOpts,
	TLShapeId,
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
			h: 120,
			feature: "10138",
			description: "related to London",
			fromFeature: "",
			score: null,
			type: "",
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
								<HTMLContainer
									className="card-container"
									style={{
										pointerEvents: "all",
									}}
								>
									<div
									// ref={(el) => {
									// 	this.element = el;
									// 	setTimeout(() => {
									// 		console.log("Feature: " + shape.props.feature);
									// 		console.log(el);
									// 		if (el && !this.measurementDone) {
									// 			const height = el.getBoundingClientRect().height;
									// 			// + 10 considers padding of parent element
									// 			const currentHeight = height + 10;
									// 			console.log(el);
									// 			console.log(el.getBoundingClientRect());
									// 			console.log("current height: " + currentHeight);
									// 			console.log("shape height: " + shape.props.h);
									// 			this.editor?.updateShape({
									// 				id: shape.id,
									// 				type: "card",
									// 				props: {
									// 					...shape.props,
									// 					h: Math.max(currentHeight, MIN_CARD_HEIGHT),
									// 				},
									// 			});
									// 			this.measurementDone = true;
									// 		}
									// 	}, 200);
									// }}
									>
										<div className="card-row">
											<h2 style={{ margin: 0 }}>{shape.props.feature}</h2>
											<div
												className="card-preview"
												onClick={(ev) => {
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
																.replace(/^0\./, ".")} ${
																shape.props.type
														  } for ${shape.props.fromFeature}`
														: ""}
												</div>
											</div>
										</div>
										<span>{shape.props.description}</span>
									</div>
								</HTMLContainer>
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

const customShape = [CardShapeUtil];

const CustomUi = track(() => {
	const editor = useEditor();

	const addFeaturesToGraph = async (type: Retrieval) => {
		const selectedShapes = editor?.getSelectedShapeIds();
		if (selectedShapes.length == 1) {
			const shape = editor?.getShape(selectedShapes[0]);
			if (!shape) return;
			// Make call to get the data

			const topK = 10;

			const { indices, values } =
				RETRIEVAL_TYPES.EFFECTS === type
					? await fetchTopEffects(
							// @ts-ignore
							shape.props.feature
					  )
					: RETRIEVAL_TYPES.COSINE_SIM === type
					? await fetchCosineSim(
							// @ts-ignore
							shape.props.feature
					  )
					: RETRIEVAL_TYPES.CO_OCCURRING_EFFECTS === type
					? await fetchCoOccurringEffects(
							// @ts-ignore
							shape.props.feature
					  )
					: await fetchTopActions(
							// @ts-ignore
							shape.props.feature
					  );

			if (type === RETRIEVAL_TYPES.CO_OCCURRING_EFFECTS) {
				console.log(indices);
				console.log(values);
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

			// Calculate the total height of all new cards
			const totalHeight = features.length * 130;
			// Calculate the starting y position to center the column
			const startY =
				type === RETRIEVAL_TYPES.COSINE_SIM
					? shape.y + 180
					: shape.y - totalHeight / 2 + 65;

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
							// @ts-ignore
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
		}
	};

	useEffect(() => {
		async function handleKeyDown(e: KeyboardEvent) {
			// Check for Cmd + Shift + key combination
			if (e.shiftKey) {
				switch (e.key) {
					case "J":
						console.log("Cmd + Shift + j pressed");
						// Add your custom action here
						await addFeaturesToGraph(RETRIEVAL_TYPES.COSINE_SIM);
						break;
					case "U":
						console.log("Cmd + Shift + U pressed");
						// Add your custom action here
						await addFeaturesToGraph(RETRIEVAL_TYPES.ACTIONS);
						break;
					case "I":
						console.log("Cmd + Shift + I pressed");
						// Add your custom action here
						await addFeaturesToGraph(RETRIEVAL_TYPES.EFFECTS);
						break;
					case "K":
						console.log("Cmd + Shift + k pressed");
						// Add your custom action here
						await addFeaturesToGraph(RETRIEVAL_TYPES.CO_OCCURRING_EFFECTS);
						break;
				}
			}
		}

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
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

function App() {
	const [featureNumber, setFeatureNumber] = useState(10138);
	const [searchQuery, setSearchQuery] = useState("");

	const [editor, setEditor] = useState<Editor | null>(null);

	const [inputFeature, setInputFeature] = useState(featureNumber.toString());

	// Search query
	const [searchResults, setSearchResults] = useState([]);
	const [isSearchFocused, setIsSearchFocused] = useState(false);

	useEffect(() => {
		setInputFeature(featureNumber.toString());
	}, [featureNumber]);

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
			const { width, height } = editor.getViewportPageBounds();
			const centerX = width / 2;
			const centerY = height / 2;

			const descriptions = await fetchDescriptions([feature]);
			const description =
				descriptions[feature.toString()] || "No description available";

			editor.createShapes([
				{
					id: createShapeId(),
					type: "card",
					x: centerX,
					y: centerY,
					props: {
						feature: feature,
						description,
					},
				},
			]);
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
						// components={components}
						shapeUtils={customShape}
						onMount={(editor: Editor) => {
							editor.sideEffects.registerAfterDeleteHandler(
								"shape",
								(shape) => {
									if (shape.type === "card") {
										const shapeId = shape.id;

										const connections = editor.store
											.allRecords()
											.filter((item) => {
												// @ts-ignore
												return (
													item.meta.fromId == shapeId ||
													item.meta.toId == shapeId
												);
											});

										connections.forEach((connection) => {
											// @ts-ignore
											editor.deleteShape(connection.id);
										});
									}

									editor.sideEffects.registerBeforeChangeHandler(
										"shape",
										(prev, next) => {
											console.log(prev);
											if (next.type === "arrow" && prev.type === "arrow") {
												return prev;
											}
											return next;
										}
									);

									// // grab the parent of the shape and check if it's a frame:
									// const parentShape = editor.getShape(shape.parentId);
									// if (parentShape && parentShape.type === "frame") {
									// 	// if it is, get the IDs of all its remaining children:
									// 	const siblings = editor.getSortedChildIdsForParent(
									// 		parentShape.id
									// 	);

									// 	// if there are none (so the frame is empty), delete the frame:
									// 	if (siblings.length === 0) {
									// 		editor.deleteShape(parentShape.id);
									// 	}
									// }
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
						top: "440px",
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
									Update
								</button>
							</form>

							<div className="search-container">
								<input
									className="search-input"
									type="text"
									placeholder="Search by description"
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
								{isSearchFocused &&
									searchResults &&
									searchResults.length > 0 && (
										<div className="search-results">
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
													<span className="result-description">
														{result[0]}
													</span>
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
						borderTopRightRadius: "10px",
						boxShadow: "0 0 10px 0 rgba(0, 0, 0, 0.1)",
						position: "fixed",
						top: 44,
						left: 4,
					}}
				></iframe>
				<button
					className="insert-feature"
					onClick={() => createCard(featureNumber)}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M5 12H19M19 12L12 5M19 12L12 19"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</button>
			</SearchQueryContext.Provider>
		</FeatureContext.Provider>
	);
}

export default App;
