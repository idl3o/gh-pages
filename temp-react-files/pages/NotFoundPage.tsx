import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const NotFoundPage = () => {
  return (
    <Layout>
      <div className="not-found-container text-center">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <div className="mt-4">
          <Link to="/" className="btn">
            Return to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundPage;