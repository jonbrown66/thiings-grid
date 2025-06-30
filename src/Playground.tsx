import React from "react"; // Import React
import SimpleNumbersExample from "./examples/SimpleNumbers";
import ColorfulGridExample from "./examples/ColorfulGrid";
import EmojiFunExample from "./examples/EmojiFun";
import CardLayoutExample from "./examples/CardLayout";

import simpleNumbersSource from "./examples/SimpleNumbers.tsx?raw";
import colorfulGridSource from "./examples/ColorfulGrid.tsx?raw";
import emojiFunSource from "./examples/EmojiFun.tsx?raw";
import cardLayoutSource from "./examples/CardLayout.tsx?raw";

export const exampleComponents = [
  SimpleNumbersExample,
  EmojiFunExample,
  ColorfulGridExample,
  CardLayoutExample,
];

export const sourceCodes = [
  simpleNumbersSource,
  emojiFunSource,
  colorfulGridSource,
  cardLayoutSource,
];

export const componentNames = sourceCodes.map((code) => {
  const match = code.match(/export\s+default\s+(\w+)/);
  return match?.[1] || "Unknown";
});
type PlaygroundProps = {
  currentExample: number;
};

const Playground = React.memo(({ currentExample }: PlaygroundProps) => {
  const ExampleComponent = exampleComponents[currentExample];

  return (
    <div className="flex-1 relative w-full h-full overscroll-none">
      <ExampleComponent />
    </div>
  );
});

export default Playground;
