$data.Entity.extend("RESO.Localization", {
//    Id: { type: "id", key: true, computed: true, nullable: false },
    Name: { type: "string" },
    ServiceURI: { type: "string" },
    Description: { type: "string" },
    DateTimeStamp: { type: "datetime" },
    Resource: { type: "RESO.Resource", inverseProperty: "Localizations"}
});

$data.Entity.extend("RESO.Resource", {
    Id: { type: "id", key: true, computed: true, nullable: false },
    Name: { type: "string" },
    ServiceURI: { type: "string" },
    Description: { type: "string" },
    DateTimeStamp: { type: "datetime", nullable: false},
    TimeZoneOffset: { type: "integer" },
    DataSystem: { type: "RESO.DataSystem", inverseProperty: "Resources"},
    Localizations: { type: "array", elementType: "RESO.Localization", inverseProperty: 'Resource'}
})

$data.Entity.extend("RESO.DataSystem", {
    Id: { type: "id", key: true, computed: true, nullable: false },
    Name: { type: "string" },
    ServiceURI: { type: "string" },
    DateTimeStamp: { type: "datetime" },
    TransportVersion: {type: "string"},
    Resources: { type: "array", elementType: "RESO.Resource", inverseProperty: 'DataSystem'}
});


$data.EntityContext.extend('RESO.Context', {
    DataSystems: { type: $data.EntitySet, elementType: RESO.DataSystem},
    Resources: { type: $data.EntitySet, elementType: RESO.Resource},
    Localizations: { type: $data.EntitySet, elementType: RESO.Localization}
});


RESO.Context.loadData = function (conf, callBack) {
    var context = conf.db;
    //context.DataSystems.add(new RESO.DataSystem({Name: 'RESO_MLS', ServiceURI: 'http://odata.fredish.com/DataSystem.svc', DateTimeStamp: new Date(), TransportVersion: "0.9"}));
    var ds1  = new RESO.DataSystem({Name: 'Utah Real Estate', ServiceURI: 'https://reso.utahrealestate.com/RESO/OData/DataSystems', DateTimeStamp: new Date(), TransportVersion: "0.0.1"});
    var rec1 = new RESO.Resource({Name: 'Property', ServiceURI: 'https://reso.utahrealestate.com/RESO/OData/Property/Properties', Description: 'RESO Standard Property Resource', DateTimeStamp: new Date(), TimeZoneOffset: -7, DataSystem: ds1});
    var rec4 = new RESO.Resource({Name: 'Media', ServiceURI: 'https://reso.utahrealestate.com/RESO/OData/Property/Media', Description: 'RESO Standard Media Resource', DateTimeStamp: new Date(), TimeZoneOffset: -7, DataSystem: ds1});
    var rec2 = new RESO.Resource({Name: 'Member', ServiceURI: 'https://reso.utahrealestate.com/RESO/OData/Property/Members', Description: 'RESO Standard Member Resource', DateTimeStamp: new Date(), TimeZoneOffset: -7, DataSystem: ds1});
    var rec3 = new RESO.Resource({Name: 'Office', ServiceURI: 'https://reso.utahrealestate.com/RESO/OData/Property/Offices', Description: 'RESO Standard Office Resource', DateTimeStamp: new Date(), TimeZoneOffset: -7, DataSystem: ds1});

    context.Resources.add(rec1);
    context.Resources.add(rec2);
    context.Resources.add(rec3);
    context.Resources.add(rec4);
    
    context.saveChanges(function (count) {
        if (callBack) {
            callBack(count);
        }
    });

};

module.exports = exports = RESO.Context;
