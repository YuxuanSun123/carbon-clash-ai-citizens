import { Component } from "react";
import type { ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || "Runtime error" };
  }
  componentDidCatch(error: Error) {
    console.error("App runtime error:", error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-5xl mb-4">⚠️</div>
            <div className="text-xl font-bold mb-2">页面运行错误</div>
            <div className="text-sm text-slate-300">{this.state.message}</div>
            <div className="mt-4 text-xs text-slate-400">请刷新页面或返回首页</div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
