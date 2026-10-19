export const keyViewingI18nSeed: Record<string, Record<string, unknown>> = {
  zh: {
    keyViewing: {
      title: '验证查看密码',
      description:
        '每次查看已保存的密钥都需要验证。密钥将在 30 秒后或窗口失焦时隐藏。可在设置 → 隐私中管理查看密码。',
      setTitle: '设置查看密码',
      setDescription:
        '首次查看已保存的密钥前，请设置 4–8 位查看密码。以后每次查看都需要输入该密码，密钥将在 30 秒后或窗口失焦时隐藏。',
      copy: '复制已保存的密钥',
      copied: '已复制',
      copyFailed: '复制失败，请重试。',
      password: '查看密码',
      newPassword: '新查看密码（4–8 位）',
      confirmation: '再次输入查看密码',
      confirm: '验证',
      save: '设置并查看',
      cancel: '取消',
      length: '查看密码需为 4–8 位。',
      mismatch: '两次输入的查看密码不一致。',
      invalid: '查看密码不正确。',
      locked: '尝试次数过多，请 1 分钟后重试。',
      unavailable: '无法查看密钥，请重试。',
    },
  },
  en: {
    keyViewing: {
      title: 'Verify viewing password',
      description:
        'Verify each time you view a saved key. Keys hide after 30 seconds or when the window loses focus. Manage your viewing password in Settings → Privacy.',
      setTitle: 'Set a viewing password',
      setDescription:
        'Before the first saved key is shown, create a 4–8 character viewing password. You will enter it for every reveal; keys hide after 30 seconds or when the window loses focus.',
      copy: 'Copy saved key',
      copied: 'Copied',
      copyFailed: 'Copy failed. Please retry.',
      password: 'Viewing password',
      newPassword: 'New viewing password (4–8 characters)',
      confirmation: 'Confirm viewing password',
      confirm: 'Verify',
      save: 'Set and reveal',
      cancel: 'Cancel',
      length: 'The viewing password must be 4–8 characters.',
      mismatch: 'The two viewing passwords do not match.',
      invalid: 'Incorrect viewing password.',
      locked: 'Too many attempts. Try again in 1 minute.',
      unavailable: 'Unable to reveal the key. Please retry.',
    },
  },
  ja: {
    keyViewing: {
      title: '閲覧パスワードを確認',
      description:
        '保存済みのキーを表示するたびに確認が必要です。30秒後、またはウィンドウがフォーカスを失うと非表示になります。設定 → プライバシーで管理できます。',
      setTitle: '閲覧パスワードを設定',
      setDescription:
        '保存済みキーを初めて表示する前に、4～8文字の閲覧パスワードを設定してください。以後の表示時に毎回入力が必要で、キーは30秒後、またはウィンドウがフォーカスを失うと非表示になります。',
      copy: '保存済みのキーをコピー',
      copied: 'コピーしました',
      copyFailed: 'コピーに失敗しました。再試行してください。',
      password: '閲覧パスワード',
      newPassword: '新しい閲覧パスワード（4～8文字）',
      confirmation: '閲覧パスワードを再入力',
      confirm: '確認',
      save: '設定して表示',
      cancel: 'キャンセル',
      length: '閲覧パスワードは4～8文字で入力してください。',
      mismatch: '入力した閲覧パスワードが一致しません。',
      invalid: '閲覧パスワードが正しくありません。',
      locked: '試行回数が多すぎます。1分後に再試行してください。',
      unavailable: 'キーを表示できません。再試行してください。',
    },
  },
};
