// 3D 載入錯誤邊界：GLTF 載入失敗時回退 fallback，絕不讓畫面崩潰
import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    // 記錄錯誤方便除錯（正式環境可接到監控）
    console.warn('[ErrorBoundary] 3D asset failed, using fallback:', error);
  }

  render() {
    if (this.state.hasError) {
      // 回退幾何體（由使用端以 fallback prop 提供）
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}
