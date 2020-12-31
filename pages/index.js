// miniprogram/pages/index.js
import mqtt from '../utils/mqtt.js';

//连接的服务器域名，注意格式！！！
const host = 'wxs://pab800a0.cn.emqx.cloud/mqtt';
Page({
    /**
     * 页面的初始数据
     */
    data: {
        status: 'Unknow',
        dateTime: new Date().toLocaleDateString(),
        temperature: 0,
        humidity: 0,

        client: null,
        topic: '/raspberry/temp',

        //记录重连的次数
        reconnectCounts: 0,
        //MQTT连接的配置
        options: {
            port: 8084,
            protocolVersion: 4, //MQTT连接协议版本
            clientId: 'huayi_pi_dht11_mini' + parseInt(Math.random() * 100 + 800, 10),
            clean: false,
            username: 'user_huayi_pi_dht11',
            password: 'poiu,0987',
            reconnectPeriod: 1000, //1000毫秒，两次重新连接之间的间隔
            connectTimeout: 10 * 1000, //收到 CONNACK 之前等待的时间，即连接超时时间
            resubscribe: true //如果连接断开并重新连接，则会再次自动订阅已订阅的主题（默认true）
        }
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        var that = this;
        that.connectBroker();
    },
    connectBroker: function(){
        var that = this;
        //开始连接
        this.data.client = mqtt.connect(host, that.data.options);
        this.data.client.on('connect', function(connack) {
            wx.showToast({
                title: '连接成功'
            });
            that.setData({
                status: 'Online'
            });
            if (that.data.client && that.data.client.connected) {
                //仅订阅单个主题
                that.data.client.subscribe(that.data.topic, function(err, granted) {
                    if (!err) {
                        console.log('订阅主题成功')
                    } else {
                        console.log('订阅主题成功')
                    }
                });
            } else {
                wx.showToast({
                    title: '请先连接服务器',
                    icon: 'none',
                    duration: 2000
                });
            }    
        })

        //服务器下发消息的回调
        that.data.client.on("message", function(topic, payload) {
            var uint8_msg = new Uint8Array(payload);
            let encodedString = String.fromCharCode.apply(null, uint8_msg);
            let escStr = escape(encodedString);
            let decodedString = decodeURIComponent(escStr);
            
            // TODO 数据解析
            let jsonObject = JSON.parse(decodedString);
            that.setData({
                dateTime: jsonObject["reported"]["TimeStamp"],
                temperature: jsonObject["reported"]["Temperature"],
                humidity: jsonObject["reported"]["Humidity"],
            });
            console.log(" 收到 topic:" + topic + " , payload :" + payload);
        });

        //服务器连接异常的回调
        that.data.client.on("close", function(error) {
            that.setData({
                status: 'Closed'
            })
            console.log(" 服务器 close 的回调" + error);
        });

        //服务器连接异常的回调
        that.data.client.on("error", function(error) {
            that.setData({
                status: 'Connect Errored'
            })
            console.log(" 服务器 error 的回调" + error);
        });
    
        //服务器重连连接异常的回调
        that.data.client.on("reconnect", function() {
            that.setData({
                status: 'Reconnecting'
            })
            console.log(" 服务器 reconnect的回调");
        });
    
        //服务器连接异常的回调
        that.data.client.on("offline", function(errr) {
            that.setData({
                status: 'Offline'
            });
            console.log(" 服务器offline的回调");
        }) 

        //服务器连接异常的回调
        that.data.client.on("disconnect", function(errr) {
            that.setData({
                status: 'disconnect'
            });
            console.log(" 服务器disconnect的回调");
        }) 
        
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {
        var that = this;
        if (that.data.client.connected){
            that.data.client.reconnect();
        }
    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        var that = this;
        that.data.client.end();
    },
    onPullDownRefresh(){
        var that = this;
        setTimeout(() => {
            that.data.client.reconnect();
            wx.stopPullDownRefresh();
        }, 1000);        
    },
   /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})