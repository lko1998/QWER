#日常使用vip
hostname = *.biliapi.*,*.bilibili.*,

#哔哩哔哩
^http[s]?:\/\/((app|api)\.(\w{2,15})?\.(com|cn)).*player\.(v3|v2|v1).Play(URL|View).*$ url script-request-header https://raw.githubusercontent.com/lko1998/Biglao/WeiRen0/blbl.js
^http[s]?:\/\/.+bilibili.+((pgc\/player\/api\/playurl)|(x\/v2\/account\/myinfo\?)|(x\/v2\/account/mine\?)).*$ url script-response-body https://raw.githubusercontent.com/lko1998/Biglao/WeiRen0/BLBLHD.js