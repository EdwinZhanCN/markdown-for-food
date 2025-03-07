import { useState, useEffect } from 'react';
import RecipeViewer from './RecipeViewer';
import './app.css';

function App() {
  const [markdownContent, setMarkdownContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 从 public 目录加载 Markdown 文件
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await fetch('/recipes/番茄炒蛋.md');
        if (!response.ok) throw new Error('文件加载失败');
        const text = await response.text();
        setMarkdownContent(text);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50/30">
      <div className="text-center p-8 rounded-lg bg-white shadow-md">
        <div className="animate-pulse flex space-x-4 mb-4 justify-center">
          <div className="rounded-full bg-amber-200 h-12 w-12"></div>
          <div className="rounded-full bg-amber-300 h-12 w-12"></div>
          <div className="rounded-full bg-amber-400 h-12 w-12"></div>
        </div>
        <p className="text-lg text-amber-800 font-medium">加载食谱中...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50/30">
      <div className="text-center p-8 rounded-lg bg-white shadow-md border border-red-200">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-red-700 mb-2">加载失败</h2>
        <p className="text-gray-600">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="App min-h-screen bg-amber-50/30 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-amber-800">智能食谱解析系统</h1>
        <p className="text-gray-600 mt-2">将普通食谱转换为交互式烹饪指南</p>
      </header>
      <RecipeViewer content={markdownContent} />
    </div>
  );
}

export default App;