import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/auth';
import TopMenu from './components/common/TopMenu';
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
import MarkdownPage from './components/MarkdownPage';
import Footer from './components/common/Footer';
import CookieConsent from './components/common/CookieConsent';
import BrandAssets from './components/BrandAssets/BrandAssets';
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
    <Router>
      <TopMenu />
      <AnimatePresence mode="wait">
        <Routes>
          <Route 
            path="/" 
            element={user ? <Navigate to="/brands" replace /> : <LandingPage />} 
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
  );
};

export default App;