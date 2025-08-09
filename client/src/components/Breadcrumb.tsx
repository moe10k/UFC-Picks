import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  const location = useLocation();

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
      <Link 
        to="/admin" 
        className="flex items-center hover:text-white transition-colors"
      >
        <HomeIcon className="w-4 h-4 mr-1" />
        Admin
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRightIcon className="w-4 h-4" />
          {item.href ? (
            <Link 
              to={item.href}
              className="hover:text-white transition-colors"
            >
              {item.name}
            </Link>
          ) : (
            <span className="text-white">{item.name}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
