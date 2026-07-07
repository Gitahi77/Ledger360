export const motion = {
  // Use for slide-outs, sidebars, heavy layouts
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
  // Use for layout components where spring bounce is unwanted
  smooth: {
    type: "tween",
    ease: "circOut",
    duration: 0.25,
  },
  // Use for small interactions like button hovers or icons
  fast: {
    type: "tween",
    ease: "easeOut",
    duration: 0.15,
  }
};
