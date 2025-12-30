import { Plus, ArrowRight, Download, Settings, Trash2 } from "lucide-react";
import Button from "../common/Button";

const ButtonExamples: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Button Component Examples</h1>

      {/* Primary Buttons */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Primary Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button size="sm">Small Primary</Button>
          <Button size="md">Medium Primary</Button>
          <Button size="lg">Large Primary</Button>
          <Button size="xl">Extra Large Primary</Button>
        </div>
      </section>

      {/* Secondary Buttons */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Secondary Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="secondary" size="sm">
            Small Secondary
          </Button>
          <Button variant="secondary" size="md">
            Medium Secondary
          </Button>
          <Button variant="secondary" size="lg">
            Large Secondary
          </Button>
          <Button variant="secondary" size="xl">
            Extra Large Secondary
          </Button>
        </div>
      </section>

      {/* Ghost Buttons */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Ghost Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="ghost" size="sm">
            Small Ghost
          </Button>
          <Button variant="ghost" size="md">
            Medium Ghost
          </Button>
          <Button variant="ghost" size="lg">
            Large Ghost
          </Button>
          <Button variant="ghost" size="xl">
            Extra Large Ghost
          </Button>
        </div>
      </section>

      {/* Outline Buttons */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Outline Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="outline" size="sm">
            Small Outline
          </Button>
          <Button variant="outline" size="md">
            Medium Outline
          </Button>
          <Button variant="outline" size="lg">
            Large Outline
          </Button>
          <Button variant="outline" size="xl">
            Extra Large Outline
          </Button>
        </div>
      </section>

      {/* Buttons with Icons */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Buttons with Icons</h2>
        <div className="flex flex-wrap gap-4">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Add Item</Button>
          <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
            Continue
          </Button>
          <Button
            leftIcon={<Download className="h-4 w-4" />}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Download & Continue
          </Button>
          <Button
            variant="secondary"
            leftIcon={<Settings className="h-4 w-4" />}
          >
            Settings
          </Button>
          <Button variant="ghost" leftIcon={<Trash2 className="h-4 w-4" />}>
            Delete
          </Button>
        </div>
      </section>

      {/* Loading Buttons */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Loading Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button loading>Loading...</Button>
          <Button variant="secondary" loading>
            Loading Secondary
          </Button>
          <Button variant="ghost" loading>
            Loading Ghost
          </Button>
          <Button variant="outline" loading>
            Loading Outline
          </Button>
        </div>
      </section>

      {/* Disabled Buttons */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Disabled Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button disabled>Disabled Primary</Button>
          <Button variant="secondary" disabled>
            Disabled Secondary
          </Button>
          <Button variant="ghost" disabled>
            Disabled Ghost
          </Button>
          <Button variant="outline" disabled>
            Disabled Outline
          </Button>
        </div>
      </section>

      {/* Full Width Buttons */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Full Width Buttons</h2>
        <div className="space-y-4 max-w-md">
          <Button className="w-full">Full Width Primary</Button>
          <Button variant="secondary" className="w-full">
            Full Width Secondary
          </Button>
          <Button variant="outline" className="w-full">
            Full Width Outline
          </Button>
        </div>
      </section>

      {/* Usage Examples */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Common Usage Examples</h2>
        <div className="space-y-4">
          <div className="flex gap-4">
            <Button leftIcon={<Plus className="h-5 w-5" />}>
              Create New Brand
            </Button>
            <Button
              variant="ghost"
              leftIcon={<ArrowRight className="h-4 w-4" />}
            >
              Continue
            </Button>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" size="lg">
              Cancel
            </Button>
            <Button size="lg" loading>
              Processing...
            </Button>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" size="sm">
              Back
            </Button>
            <Button size="sm">Save</Button>
            <Button variant="secondary" size="sm">
              Preview
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ButtonExamples;
