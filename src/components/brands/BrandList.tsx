import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { getStatusPath } from '../../lib/brandStatus';

const BrandList: React.FC = () => {
  const { brands, loadBrands, isLoading, error } = useBrandStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const handleContinue = (brandId: string, status: string) => {
    console.group('🚀 Navigating to brand component');
    console.log('Brand ID:', brandId);
    console.log('Current status:', status);
    const path = getStatusPath(status as any, brandId);
    console.log('Navigating to path:', path);
    console.groupEnd();
    
    navigate(path);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin text-primary-600 text-2xl">⟳</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Your Brands</h2>
        <button
          onClick={() => navigate('/brands/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Create New Brand
        </button>
      </div>

      {brands.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No brands yet</h3>
          <p className="text-gray-500 mb-4">Create your first brand to get started</p>
          <button
            onClick={() => navigate('/brands/new')}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Brand
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-medium text-gray-900 mb-2">{brand.name}</h3>
              {brand.description && (
                <p className="text-gray-500 mb-4 line-clamp-2">{brand.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Status: {brand.status_description || 'Unknown status'}
                </span>
                <button
                  onClick={() => handleContinue(brand.id, brand.current_status || 'new_brand')}
                  className="inline-flex items-center text-primary-600 hover:text-primary-700"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrandList;