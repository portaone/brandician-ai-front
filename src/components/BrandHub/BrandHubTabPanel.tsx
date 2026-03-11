import React from "react";

interface BrandHubTabPanelProps {
  description: string;
  children: React.ReactNode;
}

const BrandHubTabPanel: React.FC<BrandHubTabPanelProps> = ({
  description,
  children,
}) => {
  return (
    <div className="bh-tab-panel">
      <p className="bh-tab-description">{description}</p>
      {children}
    </div>
  );
};

export default BrandHubTabPanel;
