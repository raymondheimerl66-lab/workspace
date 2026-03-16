// Hook: Automatische Transkription bei Sprachmemos
export const hook = {
  event: "message.inbound",
  async run({ message, agent }: any) {
    if (!message.audio) return;
    const file = message.audio.path;
    if (!file) return;
    await agent.exec(`transcribe.sh "${file}" && cat "${file.replace('.ogg','.txt')}"`);
  }
};
