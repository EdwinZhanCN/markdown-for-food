import { useState, useEffect } from 'react';
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

/**
 * IngredientManager component handles the intelligent analysis and manipulation of recipe ingredients
 * Features:
 * - Dynamic quantity adjustment with automatic recalculation
 * - Dietary preference filtering
 * - Alternative ingredient suggestions
 */
export default function IngredientManager({ ingredients, servings, dietaryPreferences }) {
  const [adjustedServings, setAdjustedServings] = useState(servings || 2);
  const [adjustedIngredients, setAdjustedIngredients] = useState([]);
  const [showAlternatives, setShowAlternatives] = useState(false);
  
  // Ingredient alternatives database (would be expanded or moved to an API)
  const alternativesDB = {
    '鸡蛋': [
      { name: '鸭蛋', ratio: 0.7, dietary: { vegetarian: true } },
      { name: '豆腐', ratio: 2, dietary: { vegetarian: true, vegan: true } }
    ],
    '盐': [
      { name: '海盐', ratio: 1, dietary: { vegetarian: true, vegan: true, glutenFree: true } },
      { name: '酱油', ratio: 2, dietary: { vegetarian: true, vegan: true } }
    ],
    // More alternatives would be added here
  };

  // Process ingredients when they change or servings are adjusted
  useEffect(() => {
    if (!ingredients || !ingredients.length) return;
    
    // Calculate adjusted quantities based on serving size
    const servingRatio = adjustedServings / (servings || 2);
    
    const processed = ingredients.map(ingredient => {
      // Parse quantity to handle fractions and numbers
      const originalQuantity = parseQuantity(ingredient.quantity);
      const adjustedQuantity = (originalQuantity * servingRatio).toFixed(1);
      
      // Find alternatives that match dietary preferences
      const alternatives = alternativesDB[ingredient.name] || [];
      const filteredAlternatives = alternatives.filter(alt => {
        if (!dietaryPreferences) return true;
        
        // Check if alternative meets all dietary preferences
        return Object.entries(dietaryPreferences).every(([pref, value]) => {
          return !value || alt.dietary[pref];
        });
      });
      
      return {
        ...ingredient,
        originalQuantity,
        adjustedQuantity,
        displayQuantity: formatQuantity(adjustedQuantity),
        alternatives: filteredAlternatives
      };
    });
    
    setAdjustedIngredients(processed);
  }, [ingredients, adjustedServings, servings, dietaryPreferences]);

  // Helper function to parse quantity strings including fractions
  const parseQuantity = (quantityStr) => {
    if (!quantityStr) return 0;
    
    // Handle fractions like "1/2"
    if (quantityStr.includes('/')) {
      const [numerator, denominator] = quantityStr.split('/');
      return parseFloat(numerator) / parseFloat(denominator);
    }
    
    return parseFloat(quantityStr);
  };

  // Helper function to format quantities nicely
  const formatQuantity = (quantity) => {
    const num = parseFloat(quantity);
    
    // Convert decimals to fractions for better readability
    if (num === 0.5) return "1/2";
    if (num === 0.25) return "1/4";
    if (num === 0.75) return "3/4";
    if (num === 0.33) return "1/3";
    if (num === 0.67) return "2/3";
    
    // Remove trailing zeros
    if (Number.isInteger(num)) return num.toString();
    return num.toString();
  };

  // Increase serving size
  const increaseServings = () => {
    setAdjustedServings(prev => prev + 1);
  };

  // Decrease serving size (minimum 1)
  const decreaseServings = () => {
    setAdjustedServings(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="ingredient-manager bg-amber-50 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">食材管理</h3>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">调整份量:</span>
          <button 
            onClick={decreaseServings}
            className="p-1 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors"
            aria-label="减少份量"
          >
            <MinusIcon className="h-4 w-4 text-amber-800" />
          </button>
          
          <span className="font-medium mx-2">{adjustedServings}</span>
          
          <button 
            onClick={increaseServings}
            className="p-1 rounded-full bg-amber-100 hover:bg-amber-200 transition-colors"
            aria-label="增加份量"
          >
            <PlusIcon className="h-4 w-4 text-amber-800" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {adjustedIngredients.map((ingredient, index) => (
          <div key={index} className="ingredient-item flex items-center justify-between p-3 bg-white rounded-md shadow-sm">
            <div className="flex items-center">
              <span className="text-amber-600 mr-2">🥘</span>
              <span className="font-medium">{ingredient.name}</span>
              {ingredient.note && (
                <span className="text-xs text-gray-500 ml-2">({ingredient.note})</span>
              )}
            </div>
            
            <div className="flex items-center">
              <span className="bg-amber-100 px-2 py-1 rounded text-sm">
                {ingredient.displayQuantity} {ingredient.unit}
              </span>
              
              {ingredient.alternatives.length > 0 && (
                <button 
                  className="ml-2 text-xs text-amber-700 hover:text-amber-900 underline"
                  onClick={() => setShowAlternatives(prev => prev === index ? null : index)}
                >
                  替代品
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Alternatives panel */}
      {showAlternatives !== false && adjustedIngredients[showAlternatives]?.alternatives.length > 0 && (
        <div className="mt-3 p-3 bg-white rounded-md border border-amber-200">
          <h4 className="text-sm font-medium mb-2">{adjustedIngredients[showAlternatives].name}的替代选项:</h4>
          <ul className="space-y-1">
            {adjustedIngredients[showAlternatives].alternatives.map((alt, idx) => (
              <li key={idx} className="text-sm flex justify-between">
                <span>{alt.name}</span>
                <span className="text-gray-600">
                  {formatQuantity(adjustedIngredients[showAlternatives].adjustedQuantity * alt.ratio)} 
                  {adjustedIngredients[showAlternatives].unit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}