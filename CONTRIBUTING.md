# 贡献指南

在为此存储库做出贡献时，请首先通过 issue、电子邮件或任何其他方法与此存储库的所有者讨论您希望进行的更改，然后再进行更改。

**建议阅读过 [贡献者公约](https://www.contributor-covenant.org/zh-cn/version/2/0/code_of_conduct/) 后再来参与贡献**

**注意**:

- 提问之前请三思，不要浪费我们的时间
- 不要问那些你自己就能搞清楚的问题
- 不要问在文档中提过的问题

## 开发环境设置

要设置开发环境，请按照以下步骤操作：

1. Clone 本项目

   ```sh
   git clone https://github.com/CaoMeiYouRen/caomei-auth.git
   ```

2.  安装依赖

   ```sh
   npm i
   # 或 yarn
   # 或 pnpm i
   ```
3.  运行开发环境

    ```sh
    npm run dev
    ```

## 问题和功能请求

你在源代码中发现了一个错误，文档中有一个错误，或者你想要一个新功能？ 看看[GitHub 讨论](https://github.com/CaoMeiYouRen/caomei-auth/discussions)看看它是否已经在讨论中。您可以通过[在 GitHub 上提交问题](https://github.com/CaoMeiYouRen/caomei-auth/issues)来帮助我们。在创建问题之前，请确保搜索[问题存档](https://github.com/CaoMeiYouRen/caomei-auth/issues?q=is%3Aissue+is%3Aclosed) - 您的问题可能已经得到解决！

请尝试创建以下错误报告：

- *可重现*。包括重现问题的步骤。
- *具体的*。包括尽可能多的细节：哪个版本，什么环境等。
- *独特的*。不要复制现有的已打开问题。
- *范围仅限于单个错误*。每个报告一个错误。

**更好的是：提交带有修复或新功能的 Pull Requests！**

**如果是反馈 BUG，请提供一个最小的、可稳定复现 BUG 的 repo，否则将直接关闭 issue**

### 如何提交拉取请求

1. 在我们的存储库中搜索 与您的提交相关的开放或关闭的 [Pull Requests](https://github.com/CaoMeiYouRen/caomei-auth/pulls)，如果你不想重复努力。

2. Fork 本项目

3. 创建您的功能分支 ( `git checkout -b feat/your_feature`)

4. 提交您的更改

   本项目使用 [约定式提交](https://www.conventionalcommits.org/zh-hans/v1.0.0/)，因此请遵循提交消息中的规范。
   
   git commit 将用于自动化生成日志，所以请勿直接提交 git commit。
   
   非常建议使用 [commitizen](https://github.com/commitizen/cz-cli) 工具来生成 git commit，使用 husky 约束 git commit

    ```sh
    git add .
    git cz # 使用 commitizen 提交！
    git push # 请合并最新代码并解决冲突后提交！
    #请勿直接提交git commit
    #若觉得修改太多也可分开提交。先 git add 一部分，执行 git cz 提交后再提交另外一部分
    ```

    关于选项，参考 [semantic-release](https://github.com/semantic-release/semantic-release) 的文档

    -   若为 BUG 修复，则选择 `fix`
    -   若为新增功能，则选择 `feat`
    -   若为性能优化，则选择 `perf`
    -   若为移除某些功能，则选择 `BREAKING CHANGE`
        -    `BREAKING CHANGE` 和其他破坏性更新，若不是为了修复 BUG，原则上将拒绝该 PR


5. 推送到分支 ( `git push origin feat/your_feature`)

6. [打开一个新的 Pull Request](https://github.com/CaoMeiYouRen/caomei-auth/compare?expand=1)

***
_This CONTRIBUTING was generated with ❤️ by [cmyr-template-cli](https://github.com/CaoMeiYouRen/cmyr-template-cli)_
