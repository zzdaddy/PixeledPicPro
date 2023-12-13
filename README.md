<div align='center'>
<h1>Pixeled Pic Pro </h1>
<img src='README.assets/touxiang12.jpeg' alt='Boot-Vue - Opinionated Vite Starter Template' width='344'/>
</div>

<p align='center'>
关注公众号: 早早集市
<br/>
查看相关文章
</p>


## 功能
- 基于Konva
- 生成12x12的方格子
- 鼠标模式:标准/填充  填充时可上色, 标准时可拖拽
- Tab键切换颜色
- 导出图片

### Coding Style

- [@kirklin/eslint-config](https://github.com/kirklin/eslint-config)

### Recommended IDE Setup

- 🌪️ [WebStorm](https://www.jetbrains.com/webstorm/)
- 💻 [VSCode](https://code.visualstudio.com/)
- 💡 [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar)

### 功能预览
<img src='README.assets/yanshi.gif' alt='pixeled pic pro'/>

## directory

```
# boot-vue
├─.github                                # Stores GitHub related configuration files.
│  ├─ISSUE_TEMPLATE                       # GitHub Issue templates
│  └─workflows                            # GitHub Actions related configuration files
├─.husky                                  # Stores Git Hooks related configuration files
│  └─_                                    # Stores Git Hooks execution scripts
├─.idea                                   # Stores IntelliJ IDEA related configuration files
│  ├─codeStyles                           # Stores code formatting rules
│  └─inspectionProfiles                  # Stores code inspection rules
├─.vscode                                 # Stores VS Code related configuration files
├─public                                  # Stores static resources required by the web application
├─README.assets                           # Stores images and other resources used by README.md
├─src                                     # Stores the source code of the web application
│  ├─assets                               # Stores static resources required by the web application
│  ├─components                           # Stores the components of the web application
│  │  └─Icon                              # Stores the components representing icons
│  ├─config                               # Stores the configuration files of the web application
│  │  ├─nprogress                         # Stores the configuration file of the progress bar library NProgress
│  │  └─unocss                            # Stores the configuration file of the UnoCSS
│  ├─constant                             # Stores the constant values used in the web application
│  ├─layouts                              # Stores the layout components of the web application
│  │  ├─Footer                            # Stores the layout component representing the footer of the page
│  │  └─Navbar                            # Stores the layout component representing the navigation bar of the page
│  │      └─components                    # Stores the child components of the Navbar layout component
│  │          ├─LocalesChange             # Stores the child component representing language switch
│  │          └─ThemeChange               # Stores the child component representing theme switch
│  ├─locales                              # Stores the content files of the web application's multiple languages
│  ├─router                               # Stores the routing configuration files of the web application
│  │  └─routes                            # Stores the modules of the web application's routes
│  │      └─modules                       # Stores the sub-modules of the routing modules of the web application
│  ├─store                                # Stores the state management files of the web application
│  ├─styles                               # Stores the style files of the web application
│  └─views                                # Stores the page components of the web application
│      ├─errorPages                       # Stores the components representing error pages
│      └─home                             # Stores the components representing the homepage
│          └─components                   # Stores the child components of the homepage components
├─test                                    # Stores the test code
│  └─__snapshots__                        # Stores the Jest snapshot test results
└─types                                   # Stores the TypeScript type declaration files

```

## Try it now!

### GitHub Template

[Create a repo from this template on GitHub](https://github.com/kirklin/boot-vue/generate).

## Usage

### Development

Just run and visit http://localhost:8888

```bash
pnpm run dev
```

### Build

To build the App, run

```bash
pnpm run build
```

And you will see the generated file in `dist` that ready to be served.


### Deploy on Netlify

Go to [Netlify](https://app.netlify.com/start) and select your clone, `OK` along the way, and your App will be live in a minute.

### Docker Production Build

First, build the boot-vue image by opening the terminal in the project's root directory.

```bash
docker buildx build . -t viteboot:latest
```

Run the image and specify port mapping with the `-p` flag.

```bash
docker run --rm -it -p 8080:80 viteboot:latest
```

## 版本更新

### v0.6.0
实现了基本功能
