import React, {
	useState,
	createContext,
	useContext,
	useEffect,
	useCallback,
} from "react";

import "./App.css";
import {
	Tldraw,
	TLComponents,
	TLBaseShape,
	HTMLContainer,
	ShapeUtil,
	Rectangle2d,
	track,
	useEditor,
	TLEventInfo,
	Editor,
	createShapeId,
	TLShapeUtilCanBindOpts,
	ArrowBindingUtil,
	TLShapeId,
} from "tldraw";
import "tldraw/tldraw.css";
import { fetchDescriptions, fetchTopActions, fetchTopEffects } from "./utils";
import { Effect, EFFECT_TYPES } from "./types";

// Create a context for the feature number
const FeatureContext = createContext<
	| {
			featureNumber: number;
			setFeatureNumber: React.Dispatch<React.SetStateAction<number>>;
	  }
	| undefined
>(undefined);

const CustomNavigationPanel = track(() => {
	const featureContext = useContext(FeatureContext);
	if (!featureContext)
		throw new Error("FeatureContext must be used within a FeatureProvider");
	const { featureNumber, setFeatureNumber } = featureContext;
	const [inputFeature, setInputFeature] = useState(featureNumber.toString());

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const newFeature = parseInt(inputFeature);
		if (!isNaN(newFeature)) {
			setFeatureNumber(newFeature);
		}
	};

	return (
		<div>
			<div>
				<form onSubmit={handleSubmit}>
					<input
						type="text"
						value={inputFeature}
						onChange={(e) => setInputFeature(e.target.value)}
						placeholder="Enter feature number"
					/>
					<button type="submit">Update</button>
				</form>
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
				}}
			></iframe>
		</div>
	);
});

const components: TLComponents = {
	NavigationPanel: CustomNavigationPanel, // null will hide the panel instead
};

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
							<b>{shape.props.feature}</b>
							<br />
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
		return <rect width={shape.props.w} height={shape.props.h} />;
	}
}

const customShape = [CardShapeUtil];

const CustomUi = track(() => {
	const editor = useEditor();

	useEffect(() => {
		const handleKeyUp = (e: KeyboardEvent) => {
			switch (e.key) {
				case "Delete":
				case "Backspace": {
					// editor.deleteShapes(editor.getSelectedShapeIds());
					break;
				}
				case "v": {
					editor.setCurrentTool("select");
					break;
				}
				case "e": {
					editor.setCurrentTool("eraser");
					break;
				}
				case "x":
				case "p":
				case "b":
				case "d": {
					editor.setCurrentTool("draw");
					break;
				}
			}
		};

		window.addEventListener("keyup", handleKeyUp);
		return () => {
			window.removeEventListener("keyup", handleKeyUp);
		};
	});

	const addFeaturesToGraph = async (type: Effect) => {
		const selectedShapes = editor?.getSelectedShapeIds();
		if (selectedShapes.length == 1) {
			const shape = editor?.getShape(selectedShapes[0]);
			if (!shape) return;
			// Make call to get the data

			const topK = 10;

			// TODO: Get actions instead of effects here

			const { indices, values } =
				EFFECT_TYPES.EFFECTS === type
					? await fetchTopEffects(
							// @ts-ignore
							shape.props.feature
					  )
					: await fetchTopActions(
							// @ts-ignore
							shape.props.feature
					  );
			const descriptions = await fetchDescriptions(indices.slice(0, topK));

			let shapes: TLShapeId[] = [];

			indices.slice(0, topK).forEach((featureNumber: string, index: number) => {
				const id = createShapeId();
				const arrow_id = createShapeId();

				shapes.push(id);

				editor
					?.createShapes([
						{
							id: id,
							type: "card",
							x:
								shape.x +
								(type === EFFECT_TYPES.EFFECTS
									? // @ts-ignore
									  shape.props.w + 300
									: // @ts-ignore
									  -300 - shape.props.w),
							y: shape.y + index * 130,
							props: {
								feature: featureNumber.toString(),
								description: descriptions[featureNumber],
							},
						},
						{
							id: arrow_id,
							type: "arrow",
							x: 150,
							y: 150,
							props: {
								text: Number(values[index]).toFixed(2).replace(/^0\./, "."),
							},
						},
					])
					.createBindings([
						{
							fromId: arrow_id,
							toId: type === EFFECT_TYPES.EFFECTS ? selectedShapes[0] : id,
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
							toId: type === EFFECT_TYPES.EFFECTS ? id : selectedShapes[0],
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

			editor.setSelectedShapes(shapes);
		}
	};

	useEffect(() => {
		async function handleKeyDown(e: KeyboardEvent) {
			// Check for Cmd + Shift + key combination
			if (e.metaKey && e.shiftKey) {
				switch (e.key) {
					case "e":
						console.log("Cmd + Shift + e pressed");
						// Add your custom action here
						await addFeaturesToGraph(EFFECT_TYPES.EFFECTS);

						break;
					case "d":
						console.log("Cmd + Shift + d pressed");
						// Add your custom action here
						await addFeaturesToGraph(EFFECT_TYPES.ACTIONS);
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
			<div className="custom-toolbar">
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
			</div>
		</div>
	);
});

function App() {
	const [featureNumber, setFeatureNumber] = useState(10138);

	const [editor, setEditor] = useState<Editor | null>(null);

	useEffect(() => {
		if (editor) {
			const ids = {
				box1: createShapeId("box1"),
				box2: createShapeId("box2"),
				box3: createShapeId("box3"),
				arrow1: createShapeId("arrow1"),
				arrow2: createShapeId("arrow2"),
			};
			editor.createShapes([
				{
					id: ids.box1,
					type: "card",
					x: 100,
					y: 100,
					props: {
						feature: 10138,
						description: "locations, particularly related to London",
					},
				},
			]);
		}
	}, [editor]);

	return (
		<FeatureContext.Provider value={{ featureNumber, setFeatureNumber }}>
			<div style={{ position: "fixed", inset: 0 }}>
				<Tldraw
					components={components}
					shapeUtils={customShape}
					onMount={(editor: Editor) => {
						setEditor(editor);
					}}
				>
					<CustomUi />
				</Tldraw>
			</div>
		</FeatureContext.Provider>
	);
}

export default App;
