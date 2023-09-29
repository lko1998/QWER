/*
关键数据
https://litebhapi.belugabh.com/personal_center/user_equity_status_list url script-response-body Hb.js
hostname：litebhapi.belugabh.com



*/






var objc = JSON.parse($response.body);

    objc = {
  "status": 1,
  "data": {
    "compare_pk_times_remark": "对比pk剩余次数",
    "survey_export_old_app_pay_times_remark": "旧app用户剩余市调报告导出次数",
    "role_20_remark": "用户旧的poi导出次数的次数,包含新的周边配套导出的剩余次数+没有加5月9号之后的新会员的次数",
    "basic_report_limit_minutes_remaining": "0",
    "survey_export_times_remark": "市调报告导出赠送剩余次数,主要是新用户注册的时候赠送的次数（前端参与了判断扣除先后顺序的逻辑）(后来合并了新套餐市调报告的次数)+没有加5月9号之后的新会员的次数",
    "poi_open_mark": "旧用户是否开通poi服务，以及新app中开通了 数据地图包年服务",
    "current_month_poi_can_use_times": "0",
    "ai_site_selection_recommend_times": "0",
    "blue_v_can_display_uid_list": [
      "83447",
      "146",
      "65157",
      "56"
    ],
    "satisfaction_survey_pop_display_mark": "用来判断是否弹出选址报告的问卷",
    "current_month_poi_can_use_times_remark": "5月9号之后新购买的月会员之后=》当月poi的Excel导出可用的剩余次数",
    "eight_palaces_permissions_times": 1,
    "crowd_portraits_remaining_number_remark": "人群画像剩余次数",
    "satisfaction_survey_pop_display": true,
    "current_month_pdf_can_use_times_remark": "5月9号之后新购买的月会员之后=》当月pdf可用的剩余次数",
    "is_vip": false,
    "compare_pk_times": 1,
    "vip_in_use_status": "0",
    "vip_in_use_status_remark": "用户当前会员状态四种\/\/0 非会员 1 新的月会员  2 旧的月会员  3.年会员 ",
    "role_15_remark": "数据地图剩余次数（原标签【住宅\/办公】至【公共】次数 的权益）",
    "judge_crowd_portrait_discount_mark": "用来判断是否有人群画像折扣",
    "role_20": 10,//周边写字楼
    "poi_open": true,
    "judge_crowd_portrait_discount": "10",
    "survey_export_times": 10,//城市次数
    "survey_export_old_app_pay_times": 100,//周边导出次数
    "role_15": 99,//数据地图次数
    "is_vip_remark": "是否是vip会员",
    "current_month_pdf_can_use_times": "10",//当月pdf可用的剩余次数
    "basic_report_limit_seconds_remaining": "10",
    "crowd_portraits_remaining_times": 8888
  },//人像次数
  "info": "ok",
  "infocode": "10000"
}

$done({body : JSON.stringify(objc)})