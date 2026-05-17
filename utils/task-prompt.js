function buildPetPrompt(options) {
  const config = options || {};
  const mood = config.mood || 'normal';
  const recommendedTask = config.recommendedTask || null;
  const hasReadyTask = !!config.hasReadyTask;
  const points = Math.max(0, Number(config.points) || 0);

  if (recommendedTask && recommendedTask.promptText) {
    if (points <= 0 && hasReadyTask) {
      return `先完成${recommendedTask.label}，就能来照顾我啦`;
    }

    return recommendedTask.promptText;
  }

  if (mood === 'sick') {
    return '我有点不舒服，先照顾我一下吧';
  }

  if (mood === 'sad') {
    return '我在等你一起把今天的事情做好';
  }

  if (points <= 0 && hasReadyTask) {
    return '先完成一个任务，我们再一起玩';
  }

  if (mood === 'excited') {
    return '今天状态不错，我们继续保持';
  }

  return '今天做得不错，来看看接下来要做什么吧';
}

module.exports = {
  buildPetPrompt,
};
