import { useState, useEffect } from 'react';
import { CheckCircleIcon, ClockIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

/**
 * CookingStepsTimeline component provides an interactive timeline for cooking steps
 * Features:
 * - Interactive step-by-step guidance
 * - Time tracking for each step
 * - Equipment-based adjustments
 * - Progress tracking
 */
export default function CookingStepsTimeline({ steps, userEquipment }) {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [timeAdjustments, setTimeAdjustments] = useState({});
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  
  // Equipment-based cooking time adjustments
  const equipmentAdjustments = {
    '电磁炉': { '中火': 0.9, '大火': 0.85 },
    '燃气灶': { '中火': 1, '大火': 1 },
    '电饭煲': { '煮饭': 1.1 }
    // More equipment adjustments would be added here
  };

  // Process steps when they change or user equipment changes
  useEffect(() => {
    if (!steps || !steps.length) return;
    
    // Calculate time adjustments based on user equipment
    const adjustments = {};
    
    steps.forEach((step, index) => {
      if (step.equipment && step.firePower && userEquipment) {
        // Find if user has equivalent equipment that needs adjustment
        const userEquip = userEquipment.find(e => 
          Object.keys(equipmentAdjustments).includes(e));
          
        if (userEquip && equipmentAdjustments[userEquip][step.firePower]) {
          // Apply adjustment factor
          const factor = equipmentAdjustments[userEquip][step.firePower];
          adjustments[index] = factor;
        }
      }
    });
    
    setTimeAdjustments(adjustments);
  }, [steps, userEquipment]);

  // Timer functionality
  useEffect(() => {
    let timer;
    if (isTimerRunning && remainingTime > 0) {
      timer = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(timer);
  }, [isTimerRunning, remainingTime]);

  // Start timer for current step
  const startTimer = (duration) => {
    // Apply equipment-based adjustment if available
    const adjustmentFactor = timeAdjustments[activeStep] || 1;
    const adjustedDuration = Math.round(duration * adjustmentFactor);
    
    setRemainingTime(adjustedDuration);
    setIsTimerRunning(true);
  };

  // Mark step as complete and move to next
  const completeStep = (index) => {
    if (!completedSteps.includes(index)) {
      setCompletedSteps(prev => [...prev, index]);
    }
    
    if (index === activeStep && activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Extract cooking time from step description (e.g., "煮2分钟")
  const extractCookingTime = (description) => {
    const timeRegex = /(\d+)\s*分钟/;
    const match = description.match(timeRegex);
    return match ? parseInt(match[1]) * 60 : null;
  };

  return (
    <div className="cooking-timeline bg-white rounded-lg shadow p-4 mb-6">
      <h3 className="text-lg font-semibold mb-4">烹饪步骤</h3>
      
      <div className="steps-container">
        {steps.map((step, index) => {
          const isActive = index === activeStep;
          const isCompleted = completedSteps.includes(index);
          const cookingTime = extractCookingTime(step.description);
          
          return (
            <div 
              key={index} 
              className={`step-item mb-4 p-3 border-l-4 rounded transition-all ${isActive ? 'border-amber-500 bg-amber-50' : isCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-start">
                  <div className="step-number mr-3 bg-amber-100 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                    {isCompleted ? (
                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  
                  <div>
                    <p className="font-medium">{step.title}</p>
                    <p className="text-gray-600 text-sm mt-1">{step.description}</p>
                    
                    {step.equipment && (
                      <div className="mt-2 flex items-center text-xs text-gray-500">
                        <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
                        <span>{step.equipment}, {step.firePower}</span>
                        
                        {timeAdjustments[index] && timeAdjustments[index] !== 1 && (
                          <span className="ml-2 text-amber-600">
                            {timeAdjustments[index] < 1 ? '时间缩短' : '时间延长'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {cookingTime && (
                  <div className="flex items-center">
                    <button 
                      onClick={() => startTimer(cookingTime)}
                      disabled={isTimerRunning || isCompleted}
                      className="flex items-center text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                    >
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {formatTime(cookingTime)}
                    </button>
                  </div>
                )}
              </div>
              
              {isActive && (
                <div className="mt-3 flex justify-between">
                  {isTimerRunning ? (
                    <div className="text-center bg-amber-100 rounded px-3 py-1">
                      <span className="font-medium">{formatTime(remainingTime)}</span>
                      <span className="text-xs ml-1">剩余时间</span>
                    </div>
                  ) : null}
                  
                  <button
                    onClick={() => completeStep(index)}
                    className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-sm transition-colors"
                  >
                    完成步骤
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}