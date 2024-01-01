export const parseJsonVal = (arg: string) => {
  try {
    const newVal = JSON.parse(arg);
    return newVal;
  } catch (e) {
    return null;
  }
};

export const betsResponseKeysCheck = ["games", "prizePool"];
