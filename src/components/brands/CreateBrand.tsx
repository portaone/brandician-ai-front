import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBrandStore } from "../../store/brand";
import Button from "../common/Button";
import { useAutoFocus } from "../../hooks/useAutoFocus";

const CreateBrand: React.FC = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [brandPosture, setBrandPosture] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const { createBrand, isLoading, error } = useBrandStore();
  const navigate = useNavigate();

  useAutoFocus();

  const postureHints: Record<string, string> = {
    commercial:
      "Strategy will focus on market differentiation, scalability, and competitive positioning.",
    personal:
      "Strategy will focus on your personal story, expertise, and authentic voice.",
    purpose:
      "Strategy will focus on mission, community impact, and values-led communication.",
    knowledge:
      "Strategy will focus on intellectual authority, trust, and thought leadership.",
    community:
      "Strategy will focus on shared identity, belonging, and member relationships.",
    institutional:
      "Strategy will focus on trust, stability, and multi-stakeholder credibility.",
  };

  const postureOptions = [
    {
      value: "commercial",
      label: "Commercial & growth",
      description:
        "A startup, SME, or product business competing in a market. Branding focuses on differentiation, positioning, and scale.",
    },
    {
      value: "personal",
      label: "Personal brand",
      description:
        "You are the brand — expert, creator, solopreneur, or freelancer. Branding focuses on your story, credibility, and authentic voice.",
    },
    {
      value: "purpose",
      label: "Purpose-driven",
      description:
        "An NGO, non-profit, or social enterprise with a mission at the centre. Branding focuses on impact, values, and community trust.",
    },
    {
      value: "knowledge",
      label: "Knowledge & influence",
      description:
        "A consultancy, agency, academy, or think tank. Branding focuses on intellectual authority and the depth of your expertise.",
    },
    {
      value: "community",
      label: "Community & membership",
      description:
        "An association, cooperative, professional body, or club. Branding focuses on shared identity and the sense of belonging.",
    },
    {
      value: "institutional",
      label: "Institutional & enterprise",
      description:
        "A corporation, multinational, or holding company. Branding focuses on stability, trust, and credibility at scale.",
    },
  ];

  const toggleGuide = () => {
    setShowGuide(!showGuide);
  };

  const pickPosture = (value: string) => {
    setBrandPosture(value);
    setShowGuide(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const brand = await createBrand(name, description, brandPosture);
      navigate(`/brands/${brand.id}/explanation`);
    } catch (error) {
      console.error("Failed to create brand:", error);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="max-w-2xl mx-auto py-4 sm:py-8 sm:px-6 lg:px-8">
        <Button
          onClick={() => navigate("/brands")}
          variant="secondary"
          leftIcon={<ArrowLeft className="h-5 w-5" />}
          className="mb-6"
        >
          Back to Brands
        </Button>

        <div className="bg-white rounded-lg shadow px-2 md:px-6 py-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Create New Brand
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Project Name
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter project name"
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                This is just to identify this project among others; you will
                create the actual brand name later in the process
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-2 mb-3">
                <label
                  htmlFor="brand-posture"
                  className="block font-medium text-gray-700"
                >
                  Brand Posture
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <button
                  type="button"
                  onClick={toggleGuide}
                  className="font-medium text-[var(--color-light)] hover:text-[var(--color-secondary)] underline decoration-dashed hover:text-gray-900 cursor-pointer transition-colors"
                  style={{ fontSize: "var(--fs-sm)" }}
                >
                  {showGuide ? "Hide guide" : "Not sure?"}
                </button>
              </div>

              <AnimatePresence>
                {showGuide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="mb-3 overflow-hidden"
                  >
                    <div className="bg-[var(--color-bg)] rounded-lg overflow-hidden">
                      {postureOptions.map((option) => (
                        <div
                          key={option.value}
                          onClick={() => pickPosture(option.value)}
                          className="group flex gap-[16px] cursor-pointer hover:bg-[#7f597112] transition-colors"
                          style={{ padding: "10px 16px" }}
                        >
                          <span
                            style={{ fontSize: "var(--fs-sm)" }}
                            className="font-semibold text-[var(--color-secondary)] min-w-[200px] transition-colors group-hover:text-[var(--color-primary)]"
                          >
                            {option.label}
                          </span>
                          <span
                            style={{
                              fontSize: "var(--fs-sm)",
                              color: "var(--color-text)",
                              fontFamily: "Source Sans Pro, sans-serif",
                            }}
                          >
                            {option.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <select
                id="brand-posture"
                value={brandPosture}
                onChange={(e) => setBrandPosture(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
                style={{ fontSize: "var(--fs-base)" }}
              >
                <option value="">
                  Select the type of brand you're building
                </option>
                <option value="commercial">
                  Commercial &amp; growth — Startup / SME / scale-up / D2C
                </option>
                <option value="personal">
                  Personal brand — Expert / creator / solopreneur / freelancer
                </option>
                <option value="purpose">
                  Purpose-driven — NGO / non-profit / charity / social
                  enterprise
                </option>
                <option value="knowledge">
                  Knowledge &amp; influence — Consultancy / agency / think tank
                  / academy
                </option>
                <option value="community">
                  Community &amp; membership — Association / cooperative /
                  professional body
                </option>
                <option value="institutional">
                  Institutional &amp; enterprise — Corporation / multinational /
                  holding company
                </option>
              </select>

              {brandPosture && postureHints[brandPosture] && (
                <div
                  style={{ padding: "10px 14px" }}
                  className="mt-2 flex gap-[10px] bg-gray-50 rounded-md border border-gray-200"
                >
                  <div className="w-[8px] h-[8px] rounded-full bg-[var(--color-secondary)] mt-1 flex-shrink-0" />
                  <p
                    style={{ fontSize: "var(--fs-sm)" }}
                    className="font-medium text-[var(--color-secondary)]"
                  >
                    {postureHints[brandPosture]}
                  </p>
                </div>
              )}

              <p
                className="mt-2 text-[var(--color-light)]"
                style={{ fontSize: "var(--fs-sm)" }}
              >
                This shapes how your brand strategy is framed throughout the
                entire process.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-[var(--fs-sm)] font-medium text-gray-700"
              >
                Description (Optional)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your brand"
              />
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}

            <Button
              type="submit"
              disabled={isLoading || !name.trim() || !brandPosture.trim()}
              loading={isLoading}
              className="w-full"
            >
              Create Brand
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBrand;
