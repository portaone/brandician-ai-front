import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, CheckCircle, AlertCircle, Loader2, Package } from 'lucide-react';
import axios from 'axios';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { config } from '../../config';
import Button from '../common/Button';

const API_URL = config.apiUrl;
const API_PREFIX = '/api/v1.0';

interface BrandAsset {
  id: string;
  type: string;
  display_as?: string;
  description?: string;
  url?: string;
  content?: string;
}

interface BrandInfo {
  id: string;
  name: string;
  brand_name?: string;
}

type DownloadStatus = 'idle' | 'validating' | 'loading' | 'downloading' | 'success' | 'error';

const ReadOnlyDownloadContainer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<DownloadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [brandInfo, setBrandInfo] = useState<BrandInfo | null>(null);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [progress, setProgress] = useState<string>('');
  const hasStartedRef = useRef(false);

  const token = searchParams.get('token');

  // Create an axios instance that uses the provided token
  const createAuthenticatedApi = (jwtToken: string) => {
    return axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`,
      },
    });
  };

  // Extract brand_id from JWT payload (without verification - server will verify)
  const extractBrandIdFromToken = (jwtToken: string): string | null => {
    try {
      const parts = jwtToken.split('.');
      if (parts.length !== 3) return null;

      const payload = JSON.parse(atob(parts[1]));
      return payload.brand_id || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!token || hasStartedRef.current) return;
    hasStartedRef.current = true;

    const processDownload = async () => {
      try {
        setStatus('validating');
        setProgress('Validating token...');

        // Extract brand_id from token
        const brandId = extractBrandIdFromToken(token);
        if (!brandId) {
          throw new Error('Invalid token: missing brand information');
        }

        const api = createAuthenticatedApi(token);

        // Fetch brand info
        setProgress('Fetching brand information...');
        let brandData: BrandInfo;
        try {
          const brandResponse = await api.get(`${API_PREFIX}/brands/${brandId}`);
          brandData = brandResponse.data;
          setBrandInfo(brandData);
        } catch (err: any) {
          if (err.response?.status === 401) {
            throw new Error('Token has expired or is invalid. Please request a new download link.');
          }
          if (err.response?.status === 403) {
            throw new Error('Access denied. This token does not have permission to access this brand.');
          }
          throw new Error('Failed to fetch brand information');
        }

        setStatus('loading');
        setProgress('Loading brand assets...');

        // Fetch asset list
        const assetsResponse = await api.get(`${API_PREFIX}/brands/${brandId}/assets/`);
        const assetList = assetsResponse.data.assets || [];

        if (!assetList.length) {
          throw new Error('No assets available for download');
        }

        setAssets(assetList);
        setStatus('downloading');

        // Fetch full content for each asset
        const assetContents: { [key: string]: BrandAsset } = {};
        for (let i = 0; i < assetList.length; i++) {
          const asset = assetList[i];
          setProgress(`Downloading asset ${i + 1} of ${assetList.length}: ${asset.type.replace(/_/g, ' ')}...`);

          try {
            const fullAsset = await api.get(`${API_PREFIX}/brands/${brandId}/assets/${asset.id}`);
            assetContents[asset.type] = fullAsset.data;
          } catch (error) {
            console.error(`Failed to load asset ${asset.type}:`, error);
          }
        }

        setProgress('Creating ZIP archive...');

        // Create ZIP file
        const zip = new JSZip();
        const brandName = brandData.brand_name || brandData.name || 'brand';
        const brandFolder = zip.folder(brandName);

        if (!brandFolder) {
          throw new Error('Failed to create ZIP archive');
        }

        // Add each asset to the ZIP
        for (const [assetType, asset] of Object.entries(assetContents)) {
          if (asset && asset.content) {
            let fileExtension = '.txt';
            let fileName = assetType.replace(/_/g, '-');

            // Check if content is JSON
            try {
              const parsed = JSON.parse(asset.content);
              fileExtension = '.json';
              brandFolder.file(`${fileName}${fileExtension}`, JSON.stringify(parsed, null, 2));
            } catch {
              // Not JSON, determine extension based on content
              if (asset.content.includes('http') && asset.content.includes('\n')) {
                fileExtension = '.txt';
              } else if (asset.content.includes('#') && asset.content.includes('rgb')) {
                fileExtension = '.css';
              }
              brandFolder.file(`${fileName}${fileExtension}`, asset.content);
            }

            // Add metadata if available
            if (asset.description) {
              brandFolder.file(`${fileName}-info.txt`, `Type: ${assetType}\nDescription: ${asset.description}\n`);
            }
          }
        }

        // Add README file
        const readme = `${brandName} - Brand Package
${'='.repeat(50)}

Generated by Brandician AI
Date: ${new Date().toLocaleDateString()}

This package contains all your brand assets.

Contents:
${assetList.map((asset: BrandAsset) => `- ${asset.type.replace(/_/g, ' ')}`).join('\n')}

Thank you for using Brandician AI!
Visit https://brandician.ai for more information.
`;
        brandFolder.file('README.txt', readme);

        setProgress('Preparing download...');

        // Generate and download ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        saveAs(zipBlob, `${brandName}-brand-assets.zip`);

        setStatus('success');
        setProgress('');

      } catch (err: any) {
        console.error('Download failed:', err);
        setStatus('error');
        setError(err.message || 'An unexpected error occurred');
        setProgress('');
      }
    };

    processDownload();
  }, [token]);

  // Render based on status
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">Missing Token</h1>
          <p className="text-neutral-600">
            No download token was provided. Please use the download link shared with you.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">Download Failed</h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <p className="text-sm text-neutral-500">
            If this problem persists, please contact the brand owner for a new download link.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-neutral-800 mb-4">Download Complete!</h1>
          <p className="text-neutral-600 mb-2">
            Your brand assets for <strong>{brandInfo?.brand_name || brandInfo?.name}</strong> have been downloaded.
          </p>
          <p className="text-sm text-neutral-500 mb-6">
            Check your downloads folder for the ZIP file.
          </p>
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-neutral-500 mb-4">
              Want to create your own brand?
            </p>
            <Button
              onClick={() => window.location.href = '/'}
              size="md"
            >
              Visit Brandician AI
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        <div className="relative mb-6">
          <Package className="h-16 w-16 text-primary-300 mx-auto" />
          <Loader2 className="h-8 w-8 text-primary-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-800 mb-4">
          {status === 'validating' && 'Validating Access...'}
          {status === 'loading' && 'Loading Assets...'}
          {status === 'downloading' && 'Preparing Download...'}
          {status === 'idle' && 'Initializing...'}
        </h1>
        {brandInfo && (
          <p className="text-neutral-600 mb-4">
            Brand: <strong>{brandInfo.brand_name || brandInfo.name}</strong>
          </p>
        )}
        <p className="text-sm text-neutral-500">{progress}</p>
        {assets.length > 0 && (
          <div className="mt-4 text-xs text-neutral-400">
            {assets.length} asset{assets.length !== 1 ? 's' : ''} found
          </div>
        )}
      </div>
    </div>
  );
};

export default ReadOnlyDownloadContainer;
