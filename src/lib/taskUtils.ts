import { supabase } from "@/integrations/supabase/client";

/**
 * Update task progress for a user
 * Automatically marks task as completed when target is reached
 */
export const updateTaskProgress = async (
  walletAddress: string, 
  taskType: string, 
  increment: number
): Promise<boolean> => {
  try {
    const { data: task } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("wallet_address", walletAddress)
      .eq("task_type", taskType)
      .maybeSingle();

    if (task) {
      const newProgress = Math.min((task.progress || 0) + increment, task.target);
      const completed = newProgress >= task.target;

      await supabase
        .from("user_tasks")
        .update({ progress: newProgress, completed })
        .eq("id", task.id);

      console.log(`Task ${taskType}: progress ${newProgress}/${task.target}, completed: ${completed}`);
      return completed;
    }
    return false;
  } catch (error) {
    console.error("Error updating task:", error);
    return false;
  }
};

/**
 * Update trading volume tasks
 * Handles both daily and weekly trading volume tracking
 */
export const updateTradingVolume = async (
  walletAddress: string,
  volumeUsd: number
): Promise<void> => {
  try {
    // Update daily trading tasks
    await updateTaskProgress(walletAddress, "trading_500", volumeUsd);
    await updateTaskProgress(walletAddress, "trading_1000", volumeUsd);
    
    // Update weekly trading task
    await updateTaskProgress(walletAddress, "trading_2000_weekly", volumeUsd);
    
    // Update trade count task
    await updateTaskProgress(walletAddress, "trade_5_tokens", 1);
    
    console.log(`Trading volume updated: $${volumeUsd} for ${walletAddress}`);
  } catch (error) {
    console.error("Error updating trading volume:", error);
  }
};

/**
 * Ensure user has task records created
 * Called when wallet connects
 */
export const ensureUserTasks = async (walletAddress: string): Promise<void> => {
  const TASK_DEFINITIONS = [
    { task_type: "interact_clips", target: 20, points_reward: 50, reset_period: "daily" },
    { task_type: "upload_clips", target: 2, points_reward: 100, reset_period: "daily" },
    { task_type: "mint_token", target: 1, points_reward: 200, reset_period: "daily" },
    { task_type: "trading_500", target: 500, points_reward: 300, reset_period: "daily" },
    { task_type: "trading_1000", target: 1000, points_reward: 500, reset_period: "daily" },
    { task_type: "trading_2000_weekly", target: 2000, points_reward: 1000, reset_period: "weekly" },
    { task_type: "trade_5_tokens", target: 5, points_reward: 150, reset_period: "daily" },
  ];

  try {
    // Check if user has tasks
    const { data: existingTasks } = await supabase
      .from("user_tasks")
      .select("task_type")
      .eq("wallet_address", walletAddress);

    const existingTypes = new Set((existingTasks || []).map(t => t.task_type));
    
    // Create missing tasks
    const missingTasks = TASK_DEFINITIONS
      .filter(def => !existingTypes.has(def.task_type))
      .map(def => ({
        wallet_address: walletAddress,
        task_type: def.task_type,
        progress: 0,
        target: def.target,
        points_reward: def.points_reward,
        completed: false,
        reset_period: def.reset_period,
      }));

    if (missingTasks.length > 0) {
      await supabase.from("user_tasks").insert(missingTasks);
      console.log(`Created ${missingTasks.length} missing tasks for ${walletAddress}`);
    }

    // Ensure user points record exists
    const { data: existingPoints } = await supabase
      .from("user_points")
      .select("id")
      .eq("wallet_address", walletAddress)
      .maybeSingle();

    if (!existingPoints) {
      await supabase.from("user_points").insert({
        wallet_address: walletAddress,
        total_points: 0,
      });
      console.log(`Created user points record for ${walletAddress}`);
    }
  } catch (error) {
    console.error("Error ensuring user tasks:", error);
  }
};
