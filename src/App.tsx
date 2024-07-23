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
} from "tldraw";
import "tldraw/tldraw.css";

// Create a context for the feature number
const FeatureContext = createContext<
	| {
			featureNumber: number;
			setFeatureNumber: React.Dispatch<React.SetStateAction<number>>;
	  }
	| undefined
>(undefined);

function CustomNavigationPanel() {
	const featureContext = useContext(FeatureContext);
	if (!featureContext)
		throw new Error("FeatureContext must be used within a FeatureProvider");
	const { featureNumber } = featureContext;

	return (
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
	);
}

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
			w: 100,
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
							<button
								onClick={(e) => {
									e.stopPropagation();
									context.setFeatureNumber((prev) => {
										if (prev !== 1) return 1;
										return prev;
									});
								}}
							>
								hi
							</button>
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

//

const CustomUi = track(() => {
	const editor = useEditor();

	useEffect(() => {
		const handleKeyUp = (e: KeyboardEvent) => {
			switch (e.key) {
				case "Delete":
				case "Backspace": {
					editor.deleteShapes(editor.getSelectedShapeIds());
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
			</div>
		</div>
	);
});

function App() {
	const [featureNumber, setFeatureNumber] = useState(10138);

	const [editor, setEditor] = useState<Editor | null>(null);

	// const handleEvent = useCallback(
	// 	(data: TLEventInfo) => {
	// 		console.log(data.name);
	// 		if (data.name === "pointer_up") {
	// 			console.log(editor?.getSelectedShapeIds());
	// 		}
	// 		// if (data.name === "pointer_up" && editor) {
	// 		// 	const selectedShapes = editor.getSelectedShapes();
	// 		// 	if (selectedShapes.length > 0) {
	// 		// 		console.log(selectedShapes[0]);
	// 		// 	}
	// 		// }
	// 	},
	// 	[editor]
	// );

	function handleEvent(name: string, data: any) {
		// do something with the event
		console.log(name);
	}

	useEffect(() => {
		if (editor) {
			const ids = {
				box1: createShapeId("box1"),
				box2: createShapeId("box2"),
				box3: createShapeId("box3"),
				arrow1: createShapeId("arrow1"),
				arrow2: createShapeId("arrow2"),
			};
			editor
				.createShapes([
					{
						id: ids.box1,
						type: "geo",
						x: 100,
						y: 100,
						props: { w: 100, h: 100 },
					},
					{
						id: ids.box2,
						type: "geo",
						x: 300,
						y: 300,
						props: { w: 100, h: 100 },
					},
					{
						id: ids.box3,
						type: "geo",
						x: 300,
						y: 100,
						props: { w: 100, h: 100 },
					},
					{
						id: ids.arrow1,
						type: "arrow",
						x: 150,
						y: 150,
						props: {
							text: "2",
						},
					},
					{
						id: ids.arrow2,
						type: "arrow",
						x: 150,
						y: 150,
						props: {
							text: "1",
						},
					},
				])
				.createBindings([
					{
						fromId: ids.arrow1,
						toId: ids.box1,
						type: "arrow",
						props: {
							terminal: "start",
							normalizedAnchor: { x: 0.5, y: 0.5 },
							isExact: false,
							isPrecise: false,
						},
					},
					{
						fromId: ids.arrow1,
						toId: ids.box2,
						type: "arrow",
						props: {
							terminal: "end",
							normalizedAnchor: { x: 0.5, y: 0.5 },
							isExact: false,
							isPrecise: false,
						},
					},
					{
						fromId: ids.arrow2,
						toId: ids.box1,
						type: "arrow",
						props: {
							terminal: "start",
							normalizedAnchor: { x: 0.5, y: 0.5 },
							isExact: false,
							isPrecise: false,
						},
					},
					{
						fromId: ids.arrow2,
						toId: ids.box3,
						type: "arrow",
						props: {
							terminal: "end",
							normalizedAnchor: { x: 0.5, y: 0.5 },
							isExact: false,
							isPrecise: false,
						},
					},
				]);
			// console.log(editor.getCurrentPageShapesSorted());
		}
	}, [editor]);

	return (
		<FeatureContext.Provider value={{ featureNumber, setFeatureNumber }}>
			<div style={{ position: "fixed", inset: 0 }}>
				<Tldraw
					components={components}
					shapeUtils={customShape}
					onUiEvent={handleEvent}
					onMount={(editor: Editor) => {
						setEditor(editor);

						// editor.on("event", (event: TLEventInfo) => handleEvent(event));
					}}
				>
					<CustomUi />
				</Tldraw>
			</div>
		</FeatureContext.Provider>
	);
}

export default App;
