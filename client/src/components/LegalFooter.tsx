import React, { useState } from 'react';

const LegalFooter: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer className="legal-footer mt-auto border-t border-gray-700/50 bg-ufc-dark/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        {/* Compact View (Default) */}
        <div className={`transition-all duration-300 ${isExpanded ? 'hidden' : 'block'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-400">
                © 2025 Fight Predictor. Unofficial predictions platform.
              </span>
              <span className="text-xs text-gray-500">|</span>
              <span className="text-xs text-gray-400">
                Not affiliated with UFC®
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors duration-200 underline"
            >
              Legal Info
            </button>
          </div>
        </div>

        {/* Expanded View */}
        <div className={`transition-all duration-300 ${isExpanded ? 'block' : 'hidden'}`}>
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-300">Legal Information & Disclaimers</h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-xs text-gray-500 hover:text-gray-300 transition-colors duration-200 underline"
              >
                Show Less
              </button>
            </div>

            {/* Main Disclaimer */}
            <div className="bg-ufc-gray/50 rounded-lg p-3 border border-gray-600/30">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">Unofficial Platform Disclaimer:</strong> This is an unofficial 
                predictions platform. We are not affiliated with, endorsed by, or sponsored by the Ultimate Fighting 
                Championship (UFC®) or any of its subsidiaries, affiliates, or partners.
              </p>
            </div>

            {/* Trademark Notice */}
            <div className="bg-ufc-gray/50 rounded-lg p-3 border border-gray-600/30">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">Trademark Notice:</strong> All UFC trademarks, service marks, 
                trade names, logos, and related intellectual property are the property of Zuffa, LLC and/or its 
                affiliates. We do not claim ownership of any UFC intellectual property and use such marks only 
                for descriptive purposes.
              </p>
            </div>

            {/* Content Disclaimer */}
            <div className="bg-ufc-gray/50 rounded-lg p-3 border border-gray-600/30">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">Content Disclaimer:</strong> Fighter information, statistics, 
                and event details are compiled from publicly available sources. We do not claim ownership of 
                any official UFC content, fight footage, or proprietary data. All predictions and analysis 
                represent our own opinions and should not be considered professional advice.
              </p>
            </div>

            {/* Data Usage */}
            <div className="bg-ufc-gray/50 rounded-lg p-3 border border-gray-600/30">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">Data Usage:</strong> We utilize publicly available information 
                including fighter records, event schedules, and venue details. This data is used for educational 
                and entertainment purposes only. We do not scrape, copy, or reproduce copyrighted UFC content.
              </p>
            </div>

            {/* No Endorsement */}
            <div className="bg-ufc-gray/50 rounded-lg p-3 border border-gray-600/30">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">No Endorsement:</strong> The UFC®, Ultimate Fighting Championship®, 
                and related marks are registered trademarks of Zuffa, LLC. Our use of these terms does not imply 
                endorsement, sponsorship, or affiliation. We operate independently as a fan-created platform.
              </p>
            </div>

            {/* Fair Use */}
            <div className="bg-ufc-gray/50 rounded-lg p-3 border border-gray-600/30">
              <p className="text-xs text-gray-300 leading-relaxed">
                <strong className="text-gray-200">Fair Use Statement:</strong> We believe our use of publicly 
                available information falls under fair use principles for educational and non-commercial purposes. 
                We strive to respect intellectual property rights while providing value to the MMA community.
              </p>
            </div>

            {/* Contact */}
            {/*
            <div className="text-center pt-2">
              <p className="text-xs text-gray-400">
                For legal inquiries: <span className="text-gray-300">legal@fightpredictor.com</span>
              </p>
            </div>
            */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LegalFooter;
