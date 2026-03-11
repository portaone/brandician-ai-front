import React from "react";
import { UiTabConfig, UiTabKey } from "./hub-tab-config";

interface BrandHubTabBarProps {
  tabs: UiTabConfig[];
  activeTab: UiTabKey;
  onTabChange: (tab: UiTabKey) => void;
  isGuest: boolean;
}

const BrandHubTabBar: React.FC<BrandHubTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  isGuest,
}) => {
  const visibleTabs = isGuest
    ? tabs.filter((t) => t.key !== "gaps")
    : tabs;

  return (
    <div className="bh-tab-bar">
      {visibleTabs.map((tab) => {
        const isGaps = tab.key === "gaps";
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={[
              "bh-tab",
              isGaps ? "bh-gaps-tab" : "",
              isActive ? "active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {isGaps && <span className="bh-gaps-dot" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default BrandHubTabBar;
