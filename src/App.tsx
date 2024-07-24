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
} from "tldraw";
import "tldraw/tldraw.css";
import {
	fetchCosineSim,
	fetchDescriptions,
	fetchSearchResults,
	fetchTopActions,
	fetchTopEffects,
	fetchCoOccurringEffects,
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
	{ w: number; h: number; feature: string; description: string }
>;

class CardShapeUtil extends ShapeUtil<CardShape> {
	// @ts-ignore
	static override type = "card" as const;

	getDefaultProps(): CardShape["props"] {
		return {
			w: 250,
			h: 100,
			feature: "10138",
			description: "related to London",
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
				{(context) => {
					if (!context) {
						throw new Error(
							"FeatureContext must be used within a FeatureProvider"
						);
					}
					return (
						<HTMLContainer className="card-container">
							<h2 style={{ margin: 0 }}>{shape.props.feature}</h2>
							{/* <br /> */}
							<span>{shape.props.description}</span>
							{/* <button
								onClick={(e) => {
									e.stopPropagation();
									context.setFeatureNumber((prev) => {
										if (prev !== 1) return 1;
										return prev;
									});
								}}
							>
								hi
							</button> */}
						</HTMLContainer>
					);
				}}
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

	// useEffect(() => {
	// 	const handleKeyUp = (e: KeyboardEvent) => {
	// 		switch (e.key) {
	// 			case "Delete":
	// 			case "Backspace": {
	// 				// editor.deleteShapes(editor.getSelectedShapeIds());
	// 				break;
	// 			}
	// 			case "v": {
	// 				editor.setCurrentTool("select");
	// 				break;
	// 			}
	// 			case "e": {
	// 				editor.setCurrentTool("eraser");
	// 				break;
	// 			}
	// 			case "x":
	// 			case "p":
	// 			case "b":
	// 			case "d": {
	// 				editor.setCurrentTool("draw");
	// 				break;
	// 			}
	// 		}
	// 	};

	// 	window.addEventListener("keyup", handleKeyUp);
	// 	return () => {
	// 		window.removeEventListener("keyup", handleKeyUp);
	// 	};
	// });

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

			indices
				.slice(0, topK)
				.filter((featureNumber: number) => featureNumber >= 0)
				.forEach((featureNumber: string, index: number) => {
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
							y:
								(type === RETRIEVAL_TYPES.COSINE_SIM ? 180 : 0) +
								shape.y +
								index * 130,
							props: {
								feature: featureNumber.toString(),
								description: descriptions[featureNumber]
									? descriptions[featureNumber]
									: "",
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
			console.log(e);
			// Check for Cmd + Shift + key combination
			if (e.shiftKey) {
				switch (e.key) {
					case "E":
						console.log("Cmd + Shift + e pressed");
						// Add your custom action here
						await addFeaturesToGraph(RETRIEVAL_TYPES.EFFECTS);

						break;
					case "E":
						console.log("Cmd + Shift + d pressed");
						// Add your custom action here
						await addFeaturesToGraph(RETRIEVAL_TYPES.ACTIONS);
						break;
					case "E":
						console.log("Cmd + Shift + o pressed");
						// Add your custom action here
						await addFeaturesToGraph(RETRIEVAL_TYPES.COSINE_SIM);
						break;
					case "I":
						console.log("Cmd + Shift + i pressed");
						// Add your custom action here
						await addFeaturesToGraph(RETRIEVAL_TYPES.COSINE_SIM);
						break;
					case "J":
						console.log("Cmd + Shift + d pressed");
						// Add your custom action here
						await addFeaturesToGraph(RETRIEVAL_TYPES.ACTIONS);
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

	const [editor, setEditor] = useState<Editor | null>(null);

	const [inputFeature, setInputFeature] = useState(featureNumber.toString());

	// Search query
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [isSearchFocused, setIsSearchFocused] = useState(false);

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

	return (
		<FeatureContext.Provider value={{ featureNumber, setFeatureNumber }}>
			<div style={{ position: "fixed", inset: 0 }}>
				<Tldraw
					// components={components}
					shapeUtils={customShape}
					onMount={(editor: Editor) => {
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
							{isSearchFocused && searchResults.length > 0 && (
								<div className="search-results">
									{searchResults.map((result, index) => (
										<div
											key={index}
											className="search-result-item"
											onMouseDown={() => {
												setFeatureNumber(result[1]);
												setInputFeature(result[1]);
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
		</FeatureContext.Provider>
	);
}

export default App;
