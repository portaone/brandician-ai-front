import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/auth';
import TopMenu from './components/common/TopMenu';
import ErrorBoundary from './components/common/ErrorBoundary';
import LandingPage from './components/LandingPage';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';
import AuthGuard from './components/auth/AuthGuard';
import BrandList from './components/brands/BrandList';
import CreateBrand from './components/brands/CreateBrand';
import ExplanationScreen from './components/brands/ExplanationScreen';
import QuestionnaireContainer from './components/Questionnaire/QuestionnaireContainer';
import JTBDContainer from './components/JTBD/JTBDContainer';
import SurveyContainer from './components/Survey/SurveyContainer';
import CollectFeedbackContainer from './components/CollectFeedback/CollectFeedbackContainer';
import FeedbackReviewFlowContainer from './components/FeedbackReview/FeedbackReviewFlowContainer';
import BrandNameContainer from './components/BrandName/BrandNameContainer';
import BrandSummary from './components/BrandSummary/BrandSummary';
import TestimonialContainer from './components/Testimonial/TestimonialContainer';
import PaymentContainer from './components/Payment/PaymentContainer';
import PaymentSuccess from './components/Payment/PaymentSuccess';
import PaymentCancel from './components/Payment/PaymentCancel';
import PaymentCancelHandler from './components/Payment/PaymentCancelHandler';
import PaymentSuccessHandler from './components/Payment/PaymentSuccessHandler';
import CompletedContainer from './components/Completed/CompletedContainer';
import HistoryContainer from './components/History/HistoryContainer';
import ColorSchemaPresenter from './components/ColorSchemaPresenter/ColorSchemaPresenter';
import ReadOnlyDownloadContainer from './components/ReadOnlyDownload/ReadOnlyDownloadContainer';
import MarkdownPage from './components/MarkdownPage';
import Footer from './components/common/Footer';
import CookieConsent from './components/common/CookieConsent';
import BrandAssets from './components/BrandAssets/BrandAssets';
import Profile from './components/Profile';
import './index.css';

function BrandAssetsWrapper() {
  const { brandId } = useParams();
  if (!brandId) return null;
  return <BrandAssets brandId={brandId} />;
}

const App: React.FC = () => {
  const { loadUser, user } = useAuthStore();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return (
    <ErrorBoundary>
      <Router>
        <TopMenu />
        <AnimatePresence mode="wait">
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route 
            path="/start" 
            element={user ? <Navigate to="/brands" replace /> : <RegisterForm />} 
          />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/brands" replace /> : <LoginForm />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/brands" replace /> : <RegisterForm />} 
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
            path="/brands/:brandId/survey"
            element={
              <AuthGuard>
                <SurveyContainer />
              </AuthGuard>
            }
          />
          <Route
            path="/brands/:brandId/collect-feedback"
            element={
              <AuthGuard>
                <CollectFeedbackContainer />
              </AuthGuard>
            }
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
            path="/brands/:brandId/create-assets"
            element={
              <AuthGuard>
                <BrandAssetsWrapper />
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
            path="/brands/:brandId/payment/success"
            element={
              <AuthGuard>
                <PaymentSuccess />
              </AuthGuard>
            }
          />
          <Route
            path="/brands/:brandId/payment/cancel"
            element={
              <AuthGuard>
                <PaymentCancel />
              </AuthGuard>
            }
          />
          <Route
            path="/payment/paypal/cancel"
            element={
              <AuthGuard>
                <PaymentCancelHandler />
              </AuthGuard>
            }
          />
          <Route
            path="/payment/paypal/success"
            element={
              <AuthGuard>
                <PaymentSuccessHandler />
              </AuthGuard>
            }
          />
          <Route
            path="/brands/:brandId/completed"
            element={
              <AuthGuard>
                <CompletedContainer />
              </AuthGuard>
            }
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
            path="/brands/:brandId/color-schema"
            element={<ColorSchemaPresenter />}
          />
          <Route
            path="/download"
            element={<ReadOnlyDownloadContainer />}
          />
          <Route
            path="/terms"
            element={<MarkdownPage filePath="/terms-of-use.md" />}
          />
          <Route
            path="/cookies"
            element={<MarkdownPage filePath="/cookies.md" />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <CookieConsent />
      <Footer />
    </Router>
    </ErrorBoundary>
  );
};

export default App;