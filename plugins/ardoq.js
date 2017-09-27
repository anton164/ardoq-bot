var _ = require("underscore");
var ardoqClient = require("ardoq-js-client");
var nlp = require("compromise");
var markdown = require("markdown");
var site = "https://home.ardoq.com";
var client = new ardoqClient(site, null, null, "<ardoqtoken>", "home");
var models = new (require("ardoq-js-client/collections/models"))();
var fields = new (require("ardoq-js-client/collections/fields"))();
var Component = require("ardoq-js-client/models/component");

var componentTypes = [];
var fieldNames = {};


models.fetch({success:function(){
  models.models.forEach(m=>{
    _.each(m.getAllTypes(), t=>componentTypes.push(t.name));
  })
  componentTypes = _.unique(componentTypes);

  console.log("Models retrieved.");
}});

fields.fetch({success:function(){
  fields.models.forEach(m=>{
    fieldNames[m.get("name")] = m.get("label") || m.get("name");
  });
  console.log("Fields retrieved.");
}});

function componentSearch(name, type, success, error) {
  if (!type) {
    console.log("Searching for %s and no type.", name);
    client.performRequest('/api/advanced-search?size=10', 'post',
      {"condition":"AND","rules":[
        {"id":"name","field":"name","type":"string","input":"text","operator":"contains","value":name},
        {"id":"type","field":"type","type":"string","input":"select","operator":"contains","value":"component"}],
        "valid":true}, success, error);
  }
  else if (!name) {
    console.log("Searching for type %s and no name.", type);
    client.performRequest('/api/advanced-search?size=10', 'post',
      {"condition":"AND","rules":[
        {"id":"type","field":"type","type":"string","input":"select","operator":"contains","value":"component"},
        {"id":"typeName","field":"typeName","type":"string","input":"text","operator":"contains","value":type}],
        "valid":true}, success, error);
  } else {
    console.log("Searching for %s and type %s", name, type);
    client.performRequest('/api/advanced-search?size=10', 'post',
      {"condition":"AND","rules":[
        {"id":"name","field":"name","type":"string","input":"text","operator":"contains","value":name},
        {"id":"type","field":"type","type":"string","input":"select","operator":"contains","value":"component"},
        {"id":"typeName","field":"typeName","type":"string","input":"text","operator":"contains","value":type}],
        "valid":true}, success, error);
  }


}
exports.componentTypes = function(cb) {
    var msg = "";
    componentTypes.forEach(t => msg=msg+t+"\n");
    console.log("Found: "+msg);
    cb(null, msg);
}

function getCompAndType(TypeName) {
  //checking if there are any types here:
  var Type = null;
  var CompName = TypeName.toLowerCase().trim();
  componentTypes.forEach(t => {
    if (!Type) {
      Type = (CompName.startsWith(t.toLowerCase())) ? t : null;
      if (Type) {
        var matchFound = new RegExp(Type.toLowerCase()+"\\w*?\s*", "gi");
        console.log("Type: %s v.s. %s = %s",Type, CompName, matchFound.test(CompName));
        CompName = CompName.replace(matchFound, "").trim();
      }
    }
  });
  if (CompName.trim() === "") {
    console.log("Comp name should be empty");
    CompName = null;
  }
  return {
    type: Type,
    name: CompName
  }
}

exports.countComponents = function(comp, cb) {
  var componentAndType = getCompAndType(comp);
  console.log("Counting components: ", comp);
  console.log(this.user.memory);
  componentSearch(null, componentAndType.type, function(data) {
    console.log(data);
    if (data.total > 0) {
      var comp = data.results[0].doc;
      var msg = "Found "+data.total+" components of type '"+componentAndType.type+"'";
      cb(null, msg);
    }
    else {
      cb(null, "Didn't find any components of type: "+componentAndType.name);
    }
  })
};

exports.searchComponent = function(comp, cb) {
  var componentAndType = getCompAndType(comp);
  console.log("Searching for: ", comp);
  componentSearch(componentAndType.name, componentAndType.type, function(data) {
    console.log(data);
    if (data.total > 0) {
      var comp = data.results[0].doc;
      var msg = "Found "+data.total+" components";
      if (componentAndType.name) {
      msg += " named '"+componentAndType.name+"'";
      }
      if (componentAndType.type) {
        msg += " of type '"+componentAndType.type+"'";
      }
      msg +=":\n ";
      data.results.forEach(function(c) {
        msg += getComponentURL(c.doc.name, c.doc._id,c.doc.rootWorkspace)+"\n";
      });
      cb(null, {slack:msg});
    }
    else {
      cb(null, "Didn't find any components named: "+componentAndType.name);
    }
  })
};

exports.describeComponent = function(comp, cb) {
  var componentAndType = getCompAndType(comp);
  console.log("Describing: ", componentAndType);
  componentSearch(componentAndType.name, componentAndType.type, function(data) {
    console.log(data);
    if (data.total > 0) {
      var msg = "Found "+data.total+" components named '"+componentAndType.name+"':\n ";
      var localComp = new Component({_id: data.results[0].doc._id});
      localComp.on('sync', function() {
          console.log("Fetched component");
          msg += "You can read more here: "+getComponentURL(localComp.attributes.name, localComp.attributes._id,localComp.attributes.rootWorkspace)+":\n";
          msg += "Type: "+localComp.attributes.type+"\n";
          msg += localComp.attributes.description;

          cb(null, {slack:msg, markdown:true});
      });
      localComp.fetch();
      console.log(localComp);


    }
    else {
      cb(null, "Didn't find any components named: "+componentAndType.name);
    }
  })
};

exports.dependOn = function(sourceTypeName, targetTypeName, cb) {
  console.error("WEEE: source "+sourceTypeName +", target:"+ targetTypeName);
  var source = getCompAndType(sourceTypeName);
  var target = getCompAndType(targetTypeName);
  console.log("sourceType: "+source.type, " name: "+source.name+" | target type: "+target.type+", name: "+target.name);
  var callBack = function(msg) {
    cb(null, {slack:"Checking if "+source.name+" of type "+source.type+" impacts "+target.name+" of type "+target.type+"\n"+msg});
  };
  businessProcessDependencies(source.type, source.name, target.type, callBack);

}

function getComponentURL(name, id, rootWorkspace) {
  return  "<"+site+"/app/view/workspace/"+rootWorkspace+"/component/"+id+"|"+name+">";
}
function businessProcessDependencies(type, componentName, targetType = "Business Process", cb) {
  var msg = "";
  console.log("Searching for: "+ type, componentName, targetType);
  componentSearch(componentName, type, function(data) {
    if (data.total > 0) {
      var comp = data.results[0].doc;
      console.log(data, comp);
      msg = "Found "+data.total+" named "+componentName+" of type: "+type+", searching for dependencies to: "+getComponentURL(comp.name, comp._id,comp.rootWorkspace)+"\n";
      console.log(msg);
      client.performRequest('/api/graph-search', 'post', {"query":"g.V(\""+comp._id+"\").repeat(both().dedup()).until(hasLabel(\""+targetType+"\")).path()"},
        function(data) {
          if (data.result.length > 0) {
            var newMessage = "Yes, it will impact: \n";

            data.result[0].objects.forEach(r=>{
              newMessage += getComponentURL(r.label+":"+r.properties.name[0].value,r.id, r.properties.rootWorkspace[0].value);
              newMessage += " -&gt; ";
            });
            newMessage = newMessage.substr(0, newMessage.length-7);
            cb(newMessage);
            console.log(newMessage);
          }
          else {
            cb("No dependencies");
          }
        },
        function(err){console.log(err);});
    }
    else {
      msg = 'No '+type+' found for: ', componentName;
      console.log(msg);
      cb(msg);
    }

  }, function(error) {
    console.log('error while searching: ', error);
  });
}
