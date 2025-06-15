import { ReactNode } from "react";

interface BadgeProps {
  /** 子元素内容，小红点会显示在其右上角 */
  children: ReactNode;

  /** 要显示的数字，大于0时会自动显示小红点 */
  count?: number;

  /** 强制显示小红点，即使count为0也会显示 */
  show?: boolean;

  /** 是否只显示纯红点，不显示数字（优先级高于count） */
  dot?: boolean;

  /** 额外的CSS类名，用于自定义样式 */
  className?: string;
}

/**
 * Badge 小红点提示组件
 *
 * @description
 * 在任意元素的右上角显示小红点或数字提示，常用于消息通知、未读数量等场景
 *
 * @features
 * - 支持纯小红点模式和数字显示模式
 * - 数字超过99时自动显示"99+"
 * - 使用CSS伪元素实现，性能更好
 * - 响应式定位，自动适配不同大小的父元素
 * - 支持通过data属性灵活控制显示状态
 */
export const Badge = ({
  children,
  count = 0, // 默认数字为0
  show = false, // 默认不强制显示
  dot = false, // 默认显示数字模式
}: BadgeProps) => {
  // 显示逻辑：强制显示 或者 数字大于0时显示
  const shouldShow = show || count > 0;

  // 数字显示逻辑：超过99显示"99+"，否则显示原数字
  const displayCount = count > 99 ? "99+" : count.toString();

  return (
    <div
      className={`
        relative inline-block
        ${shouldShow ? "after:content-[attr(data-badge-count)]" : "after:hidden"}
        after:absolute after:top-0 after:right-0 after:translate-x-1/2
        after:bg-red-500 after:text-white after:text-xs
        after:font-semibold after:rounded-full
        ${dot ? "after:min-w-2 after:h-2" : "after:min-w-3 after:h-3"}
        after:flex after:items-center after:justify-center
        after:p-1 after:z-10
      `}
      data-badge-count={dot ? "" : displayCount} // 将要显示的内容传递给CSS的attr()函数
    >
      {children}
    </div>
  );
};
