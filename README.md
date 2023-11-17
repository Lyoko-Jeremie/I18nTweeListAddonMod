
# I18nTweeList

---

this mod export addon:

`I18nTweeList` : `I18nTweeListAddon`

如果使用这个addon，那么就不要用boot.json文件中的tweeFileList，boot.json文件中的tweeFileList会在运行时被这个addon覆盖使用对应语言的tweeFileList覆盖。   
when use this addon, don't use the `tweeFileList` in `boot.json` file , that one will be overwritten by this addon.   

```json lines

{
  "addonPlugin": [
    {
      "modName": "I18nTweeList",
      "addonName": "I18nTweeListAddon",
      "modVersion": "^1.0.0",
      "params": {
        // 主语言（备用语言），当当前语言找不到对应项文件时，使用此语言作为备用
        "mainLanguage": "zh-CN",
        "languageFile": [
          {
            "language": "zh-CN",
            "tweeFileList": [
              "zh/MyMod_Passage1.twee",
              "zh/MyMod_Passage2.twee"
            ]
          },
          {
            "language": "en-US",
            "tweeFileList": [
              "en/MyMod_Passage1.twee",
              "en/MyMod_Passage2.twee"
            ]
          },
        ],
      }
    }
  ],
  "dependenceInfo": [
    {
      "modName": "I18nTweeList",
      "version": "^1.0.0"
    }
  ]
}

```
