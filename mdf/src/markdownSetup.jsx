// src/markdownSetup.jsx
import MarkdownIt from 'markdown-it';

// 初始化 markdown-it 实例
const md = new MarkdownIt({
    html: true,        // 允许 HTML 标签
    breaks: true,      // 转换换行为 <br>
    linkify: true      // 自动识别链接
});


// ---------------------------
// 扩展: 为特定板块添加标识
// ---------------------------
md.renderer.rules.heading_open = function(tokens, idx, options, env, self) {
    const token = tokens[idx];
    const level = token.tag;
    const classes = {
        h1: 'text-4xl font-bold mb-6',
        h2: 'text-2xl font-bold mb-4 mt-6',
        h3: 'text-xl font-bold mb-3 mt-4',
        h4: 'text-lg font-bold mb-2 mt-3',
        h5: 'text-base font-bold mb-2 mt-2',
        h6: 'text-sm font-bold mb-2 mt-2'
    };

    // 获取标题内容
    const contentToken = tokens[idx + 1];
    if (contentToken && contentToken.type === 'inline') {
        const headingText = contentToken.content;
        
        // 为特定板块添加特殊类名
        if (headingText === '材料') {
            token.attrSet('class', `${classes[level] || ''} recipe-ingredients-heading`);
            token.attrSet('data-section', 'ingredients');
            
            // 在环境变量中标记当前正在处理的板块
            if (!env.recipeSections) env.recipeSections = {};
            env.recipeSections.currentSection = 'ingredients';
            
            return self.renderToken(tokens, idx, options);
        } else if (headingText === '步骤') {
            token.attrSet('class', `${classes[level] || ''} recipe-steps-heading`);
            token.attrSet('data-section', 'steps');
            
            if (!env.recipeSections) env.recipeSections = {};
            env.recipeSections.currentSection = 'steps';
            
            return self.renderToken(tokens, idx, options);
        } else if (headingText.startsWith('一、') || headingText.startsWith('二、') || headingText.startsWith('三、')) {
            // 处理步骤中的子标题（如"一、备料准备"、"二、烹饪过程"）
            token.attrSet('class', `${classes[level] || ''} recipe-steps-subheading`);
            token.attrSet('data-section', 'steps-sub');
            
            // 保持在步骤部分
            if (!env.recipeSections) env.recipeSections = {};
            env.recipeSections.currentSection = 'steps';
            
            return self.renderToken(tokens, idx, options);
        } else if (headingText === '关键技巧') {
            token.attrSet('class', `${classes[level] || ''} recipe-tips-heading`);
            token.attrSet('data-section', 'tips');
            
            if (!env.recipeSections) env.recipeSections = {};
            env.recipeSections.currentSection = 'tips';
            
            return self.renderToken(tokens, idx, options);
        } else if (headingText === '营养数据') {
            token.attrSet('class', `${classes[level] || ''} recipe-nutrition-heading`);
            token.attrSet('data-section', 'nutrition');
            
            if (!env.recipeSections) env.recipeSections = {};
            env.recipeSections.currentSection = 'nutrition';
            
            return self.renderToken(tokens, idx, options);
        } else if (headingText === '衍生变化') {
            token.attrSet('class', `${classes[level] || ''} recipe-variations-heading`);
            token.attrSet('data-section', 'variations');
            
            if (!env.recipeSections) env.recipeSections = {};
            env.recipeSections.currentSection = 'variations';
            
            return self.renderToken(tokens, idx, options);
        }
    }

    token.attrSet('class', classes[level] || '');
    
    // 重置当前板块标记
    if (env.recipeSections) {
        env.recipeSections.currentSection = null;
    }
    
    return self.renderToken(tokens, idx, options);
};



// 添加段落渲染规则
md.renderer.rules.paragraph_open = function(tokens, idx, options, env, self) {
    tokens[idx].attrSet('class', 'text-base mb-4 leading-relaxed');
    return self.renderToken(tokens, idx, options);
};


// ---------------------------
// 扩展 1: 结构化元数据块解析
// ---------------------------
md.block.ruler.before('fence', 'recipe_meta', (state, startLine) => {
    // 读取当前行开始位置
    const pos = state.bMarks[startLine];
    // 读取当前行结束位置
    const max = state.eMarks[startLine];
    // 读取当前行文本
    const lineText = state.src.slice(pos, max);

    // 检测 ```recipe 代码块
    if (lineText.startsWith('```recipe')) {
        // 查找结束标记
        let endLine = startLine;
        while (endLine < state.lineMax) {
            if (state.src.slice(state.bMarks[endLine], state.eMarks[endLine]).trim() === '```') break;
            endLine++;
        }

        // 提取 JSON/YAML 内容
        const content = state.getLines(startLine + 1, endLine, 0, true);
        try {
            const meta = JSON.parse(content);  // 支持 JSON 或 YAML 解析
            state.env.recipeMeta = meta;       // 存储到环境变量
        } catch (e) {
            console.error('Recipe metadata parse error:', e);
        }

        // 更新解析状态
        state.line = endLine + 1;
        return true;
    }
    return false;
});

// ---------------------------
// 扩展 2: 食材列表标记解析
// ---------------------------
const defaultRender = md.renderer.rules.list_item_open ||
    function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

// 为包含食材的列表添加 class
const defaultBulletListRender = md.renderer.rules.bullet_list_open ||
    function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

// 修改列表渲染规则，根据当前板块添加不同的类名
md.renderer.rules.bullet_list_open = function(tokens, idx, options, env, self) {
    // 检查这个列表是否包含食材项
    let hasIngredients = false;
    let i = idx + 1;
    
    // 遍历列表中的所有项，直到列表结束
    while (i < tokens.length && tokens[i].type !== 'bullet_list_close') {
        // 如果找到列表项，检查其内容
        if (tokens[i].type === 'list_item_open') {
            // 查找内联内容
            let j = i + 1;
            while (j < tokens.length && tokens[j].type !== 'list_item_close') {
                if (tokens[j].type === 'inline' && 
                    tokens[j].content.trim().startsWith('@')) {
                    hasIngredients = true;
                    break;
                }
                j++;
            }
        }
        if (hasIngredients) break;
        i++;
    }
    
    // 如果包含食材项，添加 ingredients 类
    if (hasIngredients) {
        tokens[idx].attrSet('class', 'ingredients');
    } 
    // 根据当前板块添加特定类名
    else if (env.recipeSections && env.recipeSections.currentSection) {
        const section = env.recipeSections.currentSection;
        if (section === 'steps') {
            tokens[idx].attrSet('class', 'recipe-steps-list');
        } else if (section === 'tips') {
            tokens[idx].attrSet('class', 'recipe-tips-list');
        } else if (section === 'variations') {
            tokens[idx].attrSet('class', 'recipe-variations-list');
        } else if (section === 'nutrition') {
            tokens[idx].attrSet('class', 'recipe-nutrition-list');
        }
    }
    
    return defaultBulletListRender(tokens, idx, options, env, self);
};

md.renderer.rules.list_item_open = function(tokens, idx, options, env, self) {
    const contentToken = tokens[idx + 2];
    if (contentToken && contentToken.type === 'inline') {
        // 处理食材项（以@开头的项）
        if (contentToken.content.trim().startsWith('@')) {
            // 检查是否在营养数据部分
            if (env.recipeSections && env.recipeSections.currentSection === 'nutrition') {
                tokens[idx].attrSet('class', 'nutrition-item');
                
                // 提取所有@标记的属性
                const attrRegex = /@([\w]+):([^@|]+)/g;
                let match;
                let displayContent = contentToken.content;
                
                // 收集所有属性
                while ((match = attrRegex.exec(contentToken.content)) !== null) {
                    const [fullMatch, key, value] = match;
                    if (key && value) {
                        tokens[idx].attrSet(`data-${key}`, value.trim());
                    }
                }
                
                // 格式化显示内容，移除@标记但保留值和其他文本
                displayContent = displayContent.replace(/@[\w]+:/g, '').replace(/\|/g, ' | ').trim();
                
                // 更新显示内容
                contentToken.content = displayContent;
                
                // 更新子节点
                if (contentToken.children && contentToken.children.length > 0) {
                    contentToken.children[0].content = displayContent;
                }
            } else {
                // 处理食材项
                const parts = contentToken.content.split(' ').filter(p => p.startsWith('@'));
                const attrs = parts.reduce((acc, part) => {
                    const [key, ...value] = part.slice(1).split(':');
                    acc[key] = value.join(':').trim();
                    return acc;
                }, {});

                // 添加属性
                tokens[idx].attrs = tokens[idx].attrs || [];

                tokens[idx].attrs.push(['class', `ingredient-item`]);
                Object.entries(attrs).forEach(([key, value]) => {
                    tokens[idx].attrs.push([`data-${key}`, value]);
                });

                // 完全替换内容为食材名称
                contentToken.content = attrs.name || '';

                // 处理内联标记
                contentToken.children = [{
                    type: 'text',
                    content: attrs.name || '',
                    level: 0
                }];
            }
        }
        // 处理营养数据项（在营养数据部分的非@开头项）
        else if (env.recipeSections && env.recipeSections.currentSection === 'nutrition') {
            tokens[idx].attrSet('class', 'nutrition-item');
        }
        // 处理步骤部分的列表项
        else if (env.recipeSections && env.recipeSections.currentSection === 'steps') {
            tokens[idx].attrSet('class', 'step-item');
        }
    }
    return defaultRender(tokens, idx, options, env, self);
};

// ---------------------------
// 扩展 3: 有序列表处理
// ---------------------------
const defaultOrderedListRender = md.renderer.rules.ordered_list_open ||
    function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

md.renderer.rules.ordered_list_open = function(tokens, idx, options, env, self) {
    // 如果在步骤部分，添加特殊类名
    if (env.recipeSections && env.recipeSections.currentSection === 'steps') {
        tokens[idx].attrSet('class', 'recipe-steps-ordered-list');
    }
    return defaultOrderedListRender(tokens, idx, options, env, self);
};

// 处理有序列表中的列表项
const defaultOrderedListItemRender = md.renderer.rules.list_item_open ||
    function(tokens, idx, options, env, self) {
        return self.renderToken(tokens, idx, options);
    };

// ---------------------------
// 导出配置好的实例
// ---------------------------
export default md;