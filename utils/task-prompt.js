function buildPetPrompt(options) {
  const config = options || {};
  const mood = config.mood || 'normal';
  const recommendedTask = config.recommendedTask || null;
  const hasReadyTask = !!config.hasReadyTask;
  const points = Math.max(0, Number(config.points) || 0);

  // 有推荐任务时，优先使用推荐任务的文案
  if (recommendedTask && recommendedTask.promptText) {
    if (points <= 0 && hasReadyTask) {
      return `先去完成${recommendedTask.label}，就能来照顾我啦`;
    }
    return recommendedTask.promptText;
  }

  // 无推荐任务时，根据宠物情绪生成文案
  if (mood === 'sick') {
    return '我不舒服啦，想被你好好照顾一下';
  }

  if (mood === 'sad') {
    return '有点不开心，陪我做完事情会好起来哦';
  }

  if (points <= 0 && hasReadyTask) {
    return '先做完一个任务，就能来陪我玩啦';
  }

  if (mood === 'excited') {
    return '今天状态超棒，我们继续保持！';
  }

  return '今天做得不错，来看看接下来做什么吧';
}

module.exports = {
  buildPetPrompt,
};
