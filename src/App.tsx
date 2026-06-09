import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useParams,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuthStore } from "./store/auth";
import TopMenu from "./components/common/TopMenu";
import ErrorBoundary from "./components/common/ErrorBoundary";
import LandingPage from "./components/LandingPage";
import LoginForm from "./components/auth/LoginForm";
import RegisterForm from "./components/auth/RegisterForm";
import AuthGuard from "./components/auth/AuthGuard";
import BrandList from "./components/brands/BrandList";
import CreateBrand from "./components/brands/CreateBrand";
import ExplanationScreen from "./components/brands/ExplanationScreen";
import QuestionnaireContainer from "./components/Questionnaire/QuestionnaireContainer";
import JTBDContainer from "./components/JTBD/JTBDContainer";
import BrandArchetype from "./components/BrandArchetype/BrandArchetype";
import SurveyContainer from "./components/Survey/SurveyContainer";
// CollectFeedback merged into SurveyContainer (BRANDICIAN-120)
import FeedbackReviewFlowContainer from "./components/FeedbackReview/FeedbackReviewFlowContainer";
import BrandNameContainer from "./components/BrandName/BrandNameContainer";
import BrandSummary from "./components/BrandSummary/BrandSummary";
import TestimonialContainer from "./components/Testimonial/TestimonialContainer";
import VisualIdentityContainer from "./components/VisualIdentity/VisualIdentityContainer";
import PaymentContainer from "./components/Payment/PaymentContainer";
import PaymentShareStep from "./components/Payment/PaymentShareStep";
import PaymentSuccess from "./components/Payment/PaymentSuccess";
import PaymentCancel from "./components/Payment/PaymentCancel";

import BrandHubContainer from "./components/BrandHub/BrandHubContainer";
import PublicHubViewer from "./components/BrandHub/PublicHubViewer";
import HistoryContainer from "./components/History/HistoryContainer";
import ColorSchemaPresenter from "./components/ColorSchemaPresenter/ColorSchemaPresenter";
import MarkdownPage from "./components/MarkdownPage";
import Footer from "./components/common/Footer";
import CookieConsent from "./components/common/CookieConsent";
// Note: Brand assets are surfaced via history / completed views, not as a standalone route here
import Profile from "./components/Profile";
import "./index.css";
import { RouterActions } from "./components/common/RouterActions";
import BrandAssets from "./components/BrandAssets/BrandAssets";
import NotFound from "./components/NotFound";

function BrandAssetsWrapper() {
  const { brandId } = useParams();
  if (!brandId) return null;
  return <BrandAssets brandId={brandId} />;
}

/**
 * Auth routes (/start, /login, /register) redirect to /brands when a user
 * is already in the store, EXCEPT when a magic-link token is present in
 * the URL. Without this carve-out, returning users whose JWT has expired
 * but whose persisted `user` is still in localStorage would never see the
 * auth form mount when clicking a magic link — the redirect would swallow
 * the ?magic=<token> query string and the verification never runs.
 */
function AuthRouteGate({
  user,
  children,
}: {
  user: unknown;
  children: React.ReactNode;
}) {
  const hasMagicToken =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("magic");
  if (user && !hasMagicToken) {
    return <Navigate to="/brands" replace />;
  }
  return <>{children}</>;
}

const App: React.FC = () => {
  const { loadUser, user } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <ErrorBoundary>
      <Router>
        <RouterActions />
        <TopMenu />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/start"
              element={
                <AuthRouteGate user={user}>
                  <RegisterForm />
                </AuthRouteGate>
              }
            />
            <Route
              path="/login"
              element={
                <AuthRouteGate user={user}>
                  <LoginForm />
                </AuthRouteGate>
              }
            />
            <Route
              path="/register"
              element={
                <AuthRouteGate user={user}>
                  <RegisterForm />
                </AuthRouteGate>
              }
            />
            <Route
              path="/brands"
              element={
                <AuthGuard>
                  <BrandList />
                </AuthGuard>
              }
            />
            <Route
              path="/profile"
              element={
                <AuthGuard>
                  <Profile />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/new"
              element={
                <AuthGuard>
                  <CreateBrand />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/explanation"
              element={
                <AuthGuard>
                  <ExplanationScreen />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/questionnaire"
              element={
                <AuthGuard>
                  <QuestionnaireContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/jtbd"
              element={
                <AuthGuard>
                  <JTBDContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/archetype"
              element={<BrandArchetype />}
            />
            <Route
              path="/brands/:brandId/survey"
              element={
                <AuthGuard>
                  <SurveyContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/collect-feedback"
              element={<Navigate to="../survey" replace />}
            />
            <Route
              path="/brands/:brandId/summary"
              element={
                <AuthGuard>
                  <BrandSummary />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/feedback-review/summary"
              element={
                <AuthGuard>
                  <FeedbackReviewFlowContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/feedback-review/jtbd"
              element={
                <AuthGuard>
                  <FeedbackReviewFlowContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/feedback-review/primary-persona"
              element={
                <AuthGuard>
                  <FeedbackReviewFlowContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/feedback-review/archetype"
              element={
                <AuthGuard>
                  <FeedbackReviewFlowContainer />
                </AuthGuard>
              }
            />
            {/* Fallback route for old feedback-review path - redirects to specific step */}
            <Route
              path="/brands/:brandId/feedback-review"
              element={
                <AuthGuard>
                  <FeedbackReviewFlowContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/pick-name"
              element={
                <AuthGuard>
                  <BrandNameContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/create-visual-identity"
              element={
                <AuthGuard>
                  <VisualIdentityContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/create-hub"
              element={
                <AuthGuard>
                  <BrandHubContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/testimonial"
              element={
                <AuthGuard>
                  <TestimonialContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/payment"
              element={
                <AuthGuard>
                  <PaymentContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/payment/share"
              element={
                <AuthGuard>
                  <PaymentShareStep />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/payment/:processor/success"
              element={
                <AuthGuard>
                  <PaymentSuccess />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/payment/:processor/cancel"
              element={
                <AuthGuard>
                  <PaymentCancel />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/completed"
              element={
                <AuthGuard>
                  <BrandHubContainer isComplete={true} />
                </AuthGuard>
              }
            />
            <Route
              path="/completed"
              element={<BrandHubContainer isComplete={true} />}
            />
            <Route
              path="/brands/:brandId/history"
              element={
                <AuthGuard>
                  <HistoryContainer />
                </AuthGuard>
              }
            />
            <Route
              path="/brands/:brandId/color-schema/draft/:variantIndex"
              element={<ColorSchemaPresenter />}
            />
            <Route
              path="/brands/:brandId/color-schema/:variantIndex?"
              element={<ColorSchemaPresenter />}
            />
            <Route
              path="/terms"
              element={<MarkdownPage filePath="/terms-of-use.md" />}
            />
            <Route
              path="/cookies"
              element={<MarkdownPage filePath="/cookies.md" />}
            />
            <Route path="/hub/:slug" element={<PublicHubViewer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
        <CookieConsent />
        <Footer />
      </Router>
    </ErrorBoundary>
  );
};

export default App;
