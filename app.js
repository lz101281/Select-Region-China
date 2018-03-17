var url = 'http://www.mca.gov.cn/article/sj/tjbz/a/2018/201803131439.html';
var http = require('http');
var cheerio = require('cheerio');
var fs = require('fs');

function filterData(html) {
    var $ = cheerio.load(html);
    var data = $('tr');
    var courseData = [];
    data.each(function (item, index) {
        var it = $(this);
        var value = it.find('td').eq(1).text();
        var label = it.find('td').eq(2).text();

        if (!isNaN(value) && value != 0) {
            courseData.push({ value, label });
        }

    })
    return courseData
}

http.get(url, function (res) {
    var html = '';
    res.on('data', function (data) {
        html += data;
    })
    res.on('end', function () {
        var all = filterData(html);
        var fs = require('fs');
        var outputFilename = './data.json';
        fs.writeFile(outputFilename, JSON.stringify(all), function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("原始数据保存成功到data.json文件中" + outputFilename);
            }
        });

        let allProvinceIndex = [];
        all.forEach(function (item, index) {
            if (item.value.substring(2, 6) === "0000") {
                allProvinceIndex.push(index);
            }
        })
        // console.log(allProvinceIndex)
        var twoArrayIndex = [];
        allProvinceIndex.forEach(function (item, index) {
            var arr = [];
            if (index !== allProvinceIndex.length - 1) {
                arr.push(item, allProvinceIndex[index + 1] - 1);
            } else {
                arr.push(item, all.length - 1)
            }
            twoArrayIndex.push(arr);
        });

        var twoArray = [];
        twoArrayIndex.forEach(function (item) {
            var proviceData = [];
            if (item[0] === item[1]) {
                proviceData.push(all[item[0]]);
            } else {
                proviceData = all.slice(item[0], item[1]);
            }
            twoArray.push(proviceData);
        });

        var endData = [];

        twoArray.forEach(function (itemAll) {
            var data = {};
            //特殊情况 香港 澳门 台湾 三级目录一样
            if (itemAll.length === 1) {
                data = {
                    value: itemAll[0].value,
                    label: itemAll[0].label,
                    children: [],
                };

            } else {
                data = {
                    value: itemAll[0].value,
                    label: itemAll[0].label,
                    children: [],
                }
                //特殊情况直辖市
                if (itemAll[1].value.substring(5, 6) !== "0") {
                    data.children.push({
                        value: itemAll[0].value,
                        label: itemAll[0].label,
                        children: [],
                    })
                    itemAll.forEach(function (item, _index) {
                        if (_index !== 0) {
                            data.children[0].children.push(item);
                        }
                    })
                } else {
                    data = {
                        value: itemAll[0].value,
                        label: itemAll[0].label,
                        children: [],
                    };
                    var city = []
                    itemAll.forEach(function (item, index) {
                        if (index !== 0 && item.value.substring(4, 6) === "00") {
                            data.children.push({
                                value: item.value,
                                label: item.label,
                                children: []
                            })
                            city.push(index);
                        }
                    })
                    //将城市分为二维数组 
                    var twoArrayCity = [];
                    city.forEach(function (item, index) {
                        var arr = [];
                        if (index !== city.length - 1) {
                            arr.push(item+1, city[index + 1]);
                        } else {
                            arr.push(item+1, itemAll.length - 1);
                        }
                        twoArrayCity.push(arr);
                    })
                    twoArrayCity.forEach(function(item, index){
                        data.children[index].children=itemAll.slice(item[0],item[1]);
                    });
                }

            }

            endData.push(data);
        });
        //生成最终数据

        var outputData = './generateData.json';
        fs.writeFile(outputData, JSON.stringify(endData), function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("最终数据保存成功到generateData.json文件中" + outputData);
            }
        });

    })
}).on('error', function () {
    console.log('获取数据失败')
})
//create by Put