// src/RecipeViewer.js
import { useEffect, useMemo, useState } from 'react';
import md from './markdownSetup.jsx';
import { UserIcon } from '@heroicons/react/24/outline';
import { ClockIcon } from '@heroicons/react/24/outline';
import { ChartPieIcon } from '@heroicons/react/24/outline';
import IngredientManager from './components/IngredientManager';
import CookingStepsTimeline from './components/CookingStepsTimeline';


export default function RecipeViewer({ content }) {
    const [html, setHtml] = useState('');
    const [meta, setMeta] = useState(null);
    const [ingredients, setIngredients] = useState([]);
    const [cookingSteps, setCookingSteps] = useState([]);
    const [userEquipment, setUserEquipment] = useState(['燃气灶']);
    const [userPreferences, setUserPreferences] = useState({
        vegetarian: false,
        vegan: false,
        glutenFree: false
    });

    // 处理 Markdown 转换
    useEffect(() => {
        const env = {};  // 用于存储元数据
        const result = md.render(content, env);
        setHtml(result);
        setMeta(env.recipeMeta || null);
        
        // 提取食材信息
        if (content) {
            const ingredientLines = content.split('\n')
                .filter(line => line.trim().startsWith('- @'))
                .map(line => {
                    // 解析食材属性
                    const parts = line.split(' ').filter(p => p.startsWith('@'));
                    const ingredient = parts.reduce((acc, part) => {
                        const [key, ...value] = part.slice(1).split(':');
                        acc[key] = value.join(':').trim();
                        return acc;
                    }, {});
                    
                    // 确保只返回有效的食材（必须有名称）
                    return ingredient.name ? ingredient : null;
                })
                .filter(Boolean); // 过滤掉无效的食材
            setIngredients(ingredientLines);
            
            // 提取烹饪步骤信息
            const stepsSection = content.split('## 步骤')[1];
            if (stepsSection) {
                const stepsText = stepsSection.split('## 关键技巧')[0]; // 获取到下一个主要标题前的内容
                
                // 解析步骤，忽略子标题（如"一、备料准备"）
                const stepRegex = /\d+\.\s+\*\*(.+?)\*\*\s+(?:\[@(.+?)\])?\s*([\s\S]+?)(?=\d+\.|##|$)/g;
                const steps = [];
                let match;
                
                while ((match = stepRegex.exec(stepsText)) !== null) {
                    const title = match[1];
                    const attributes = match[2] ? match[2].split(' ') : [];
                    const description = match[3].trim();
                    
                    // 解析属性
                    const attrs = {};
                    attributes.forEach(attr => {
                        const [key, value] = attr.split(':');
                        if (key && value) attrs[key] = value;
                    });
                    
                    steps.push({
                        title,
                        description,
                        equipment: attrs.tool || attrs.equipment,
                        firePower: attrs.火候,
                        time: attrs.time
                    });
                }
                
                setCookingSteps(steps);
            }
        }
    }, [content]);

    // 渲染元数据卡片
        // 渲染元数据卡片
        const renderMeta = useMemo(() => {
            if (!meta) return null;
            return (
                <div className="p-6 bg-white rounded-lg shadow-md border border-gray-100">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800 border-b pb-2">{meta.meta?.title}</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="flex items-center">
                            <div className="bg-amber-50 p-2 rounded-full mr-3">
                                <UserIcon className="size-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">作者</p>
                                <p className="font-medium">{meta.meta?.author || '未知'}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center">
                            <div className="bg-amber-50 p-2 rounded-full mr-3">
                                <ClockIcon className="size-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">准备时间</p>
                                <p className="font-medium">{meta.meta?.prepTime}</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center">
                            <div className="bg-amber-50 p-2 rounded-full mr-3">
                                <ChartPieIcon className="size-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">份量</p>
                                <p className="font-medium">{meta.meta?.servings} 人份</p>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }, [meta]);

    return (
        <div className="recipe-container max-w-4xl mx-auto p-4">
            {renderMeta}
            
            {/* 食材管理器 */}
            {ingredients.length > 0 && (
                <IngredientManager 
                    ingredients={ingredients} 
                    servings={meta?.meta?.servings || 2}
                    dietaryPreferences={userPreferences}
                />
            )}

            {/* 烹饪步骤时间线 */}
            {cookingSteps.length > 0 && (
                <CookingStepsTimeline 
                    steps={cookingSteps}
                    userEquipment={userEquipment}
                />
            )}
            
            {/* 食谱内容 */}
            <div className="recipe-content mt-6" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
}