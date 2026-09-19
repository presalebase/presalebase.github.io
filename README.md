# Presale Base

找預售屋，從基地周邊開始看。

這個公開網站收錄大台北已領建照、預售備查、預售中或近期完工的住宅案件，提供捷運、建商研究、價格、定位可信度與基地周邊環境圖層，作為購屋前的研究與比較入口。

## 頁面

- `/`：大台北預售建案與地圖
- `/developers/`：建商研究與評分方法

## 本機啟動

```bash
npm install
npm run dev
```

## 部署

此專案以 GitHub Actions 部署至 GitHub Pages。建立名為 `presale-base.github.io` 的公開 repository 後，將 Pages 的 Source 設為 **GitHub Actions**；部署網址將是 `https://presale-base.github.io/`。

每日工作流程會更新本站快取的降雨淹水、土壤液化、活動斷層與環境設施圖層。建案資料與建商研究則採版本化資料，應先經查核後再更新。
