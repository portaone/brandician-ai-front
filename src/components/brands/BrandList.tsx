import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import { useBrandStore } from '../../store/brand';
import { getRouteForStatus } from '../../lib/navigation';
import Button from '../common/Button';

const BrandList: React.FC = () => {
  const { brands, loadBrands, isLoading, error } = useBrandStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadBrands();
  }, []);

  const handleContinue = (brandId: string, status: string) => {
    console.group('🚀 Navigating to brand component');
    console.log('Brand ID:', brandId);
    console.log('Current status:', status);
    const path = getRouteForStatus(brandId, status as any);
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
    <div className="container mx-auto px-4 pt-8 min-h-[calc(100vh-300px)]">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Your Brands</h2>
          <Button
            onClick={() => navigate('/brands/new')}
            leftIcon={<Plus className="h-5 w-5" />}
          >
            Create New Brand
          </Button>
        </div>

        {brands.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No brands yet</h3>
            <p className="text-gray-500 mb-4">Create your first brand to get started</p>
            <Button
              onClick={() => navigate('/brands/new')}
              leftIcon={<Plus className="h-5 w-5" />}
            >
              Create Brand
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow flex flex-col"
              >
                <h3 className="text-lg font-medium text-gray-900 mb-2">{brand.name}</h3>
                {brand.description && (
                  <p className="text-gray-500 mb-4 line-clamp-2">{brand.description}</p>
                )}
                <div className="flex-grow">
                  <span className="text-sm text-gray-500">
                    Status: {brand.status_description || 'Unknown status'}
                  </span>
                </div>
                <div className="mt-4">
                  <Button
                    onClick={() => handleContinue(brand.id, brand.current_status || 'new_brand')}
                    variant="primary"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    className="w-full"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandList;