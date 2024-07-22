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
	TLOnClickHandler,
	Editor,
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
type CardShape = TLBaseShape<"card", { w: number; h: number; text: string }>;

class CardShapeUtil extends ShapeUtil<CardShape> {
	static override type = "card" as const;

	getDefaultProps(): CardShape["props"] {
		return {
			w: 100,
			h: 100,
			text: "1",
		};
	}

	getGeometry(shape: CardShape) {
		return new Rectangle2d({
			width: shape.props.w,
			height: shape.props.h,
			isFilled: true,
		});
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
							Feature {shape.props.text}
							<button
								onClick={(e) => {
									e.stopPropagation();
									console.log("hi");
									context.setFeatureNumber(1);
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

	// override onClick: TLOnClickHandler<CardShape> = (shape) => {
	// 	console.log("Card clicked:", shape);
	// 	return undefined;
	// };
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

	const handleEvent = useCallback(
		(data: TLEventInfo) => {
			console.log(data.name);
			if (data.name == "pointer_up" && editor) {
				console.log(data);

				const selectedShapes = editor.getSelectedShapes();

				console.log(selectedShapes);
				if (selectedShapes.length > 0) {
					const selectedShape = selectedShapes[0];
					console.log(selectedShape);
				}
			}
		},
		[editor]
	);

	return (
		<FeatureContext.Provider value={{ featureNumber, setFeatureNumber }}>
			<div style={{ position: "fixed", inset: 0 }}>
				<Tldraw
					components={components}
					shapeUtils={customShape}
					onMount={(editor) => {
						setEditor(editor);
						editor.createShape({ type: "card", x: 100, y: 100 });
						editor.on("event", (event) => handleEvent(event));
					}}
				>
					<CustomUi />
				</Tldraw>
			</div>
		</FeatureContext.Provider>
	);
}

export default App;
