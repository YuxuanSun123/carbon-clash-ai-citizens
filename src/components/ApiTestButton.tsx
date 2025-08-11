import React, { useState } from 'react';

const ApiTestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const testApi = async () => {
    setIsLoading(true);
    setResult('');
    setError('');
    
    try {
      console.log('🧪 Testing API proxy...');
      
      const testRequest = {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say "Hello, proxy test successful!"' }
        ],
        temperature: 0.7,
        max_tokens: 50
      };
      
      const apiUrl = '/api/deepseek/v1/chat/completions';
      console.log('📍 Testing URL:', apiUrl);
      console.log('📤 Request data:', JSON.stringify(testRequest, null, 2));
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testRequest)
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Response data:', data);
      
      const content = data.choices?.[0]?.message?.content || 'No content received';
      setResult(content);
      
    } catch (err) {
      console.error('💥 API test failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-xl p-4 z-40 w-80">
      <h3 className="text-lg font-bold text-white mb-3">🧪 API 代理测试</h3>
      
      <button
        onClick={testApi}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium mb-3 transition-colors"
      >
        {isLoading ? '测试中...' : '测试 API 代理'}
      </button>
      
      {result && (
        <div className="mb-3 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
          <h4 className="text-green-400 font-semibold mb-1">✅ 成功:</h4>
          <p className="text-green-300 text-sm">{result}</p>
        </div>
      )}
      
      {error && (
        <div className="mb-3 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
          <h4 className="text-red-400 font-semibold mb-1">❌ 错误:</h4>
          <p className="text-red-300 text-sm break-words">{error}</p>
        </div>
      )}
      
      <div className="text-xs text-gray-400">
        检查浏览器控制台和终端日志获取详细信息
      </div>
    </div>
  );
};

export default ApiTestButton;