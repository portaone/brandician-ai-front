import React from "react";
import Button from "../common/Button";

const ButtonSizeTest: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Button Size Test</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-2">Small Button (14px)</h2>
          <Button size="sm">Small Button Text</Button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            Medium Button (16px) - Default
          </h2>
          <Button size="md">Medium Button Text</Button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Large Button (18px)</h2>
          <Button size="lg">Large Button Text</Button>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">
            Extra Large Button (20px)
          </h2>
          <Button size="xl">Extra Large Button Text</Button>
        </div>
      </div>

      <div className="border-t pt-8">
        <h2 className="text-lg font-semibold mb-4">All Sizes Side by Side</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button size="xl">XL</Button>
        </div>
      </div>
    </div>
  );
};

export default ButtonSizeTest;
