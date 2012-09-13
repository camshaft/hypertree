var w = 960,
    h = 900,
    i = 0,
    duration = 300,
    root,
    cache={};

var tree = d3.layout.tree()
    .size([h, w - 160]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var vis = d3.select("#chart").append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .call(d3.behavior.zoom().scaleExtent([1, 8]).on("zoom", zoom))
    .append("svg:g")
    .attr("transform", "translate(40,0)");

var rootURL = "http://camshaft.github.com/hypertree/api";

d3.json(rootURL, function(me) {
  me.x0 = 800;
  me.y0 = 0;
  cache[rootURL] = me;
  update(root = me);
});

function update(source) {

  tree.children(function(node) {
    if(!node) return;
    if(node.children) return node.children;
    if(node._children) return [];

    var person = node.collection.items[0];
    var parents = [];

    // Get the parent links
    var father = _.find(person.links, function(link) {
      return link.rel == 'father';
    });
    var mother = _.find(person.links, function(link) {
      return link.rel == 'mother';
    });
    
    var parentsUpdated = function() {
      if ( (!father||(father&&parents[0]))
        && (!mother||(mother&&parents[1]))) {
        setTimeout(function() {
          update(root);
        }, duration);
      }
    };

    // Father
    if (father){
      if(cache[father.href]) {
        parents[0] = cache[father.href];
      }
      else if (!cache[father.href]) {
        d3.json(father.href, function(fatherData) {
          cache[father.href] = fatherData;
          parents[0] = fatherData;
          parentsUpdated();
        });
      }
    }
    // Mother
    if (mother){
      if(cache[mother.href]) {
        parents[1] = cache[mother.href];
      }
      else if (!cache[mother.href]) {
        d3.json(mother.href, function(motherData) {
          cache[mother.href] = motherData;
          parents[1] = motherData;
          parentsUpdated();
        });
      }
    }
    return parents;
  });

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse();
  // Update the nodes…
  var node = vis.selectAll("g.node")
    .data(nodes, function(d) { return d.id || (d.id = ++i); });

  var nodeEnter = node.enter().append("svg:g")
      .attr("class", "node")
      .attr("transform", function(d) { 
        if (d.parent) {
          return "translate(" + d.parent.y0 + "," + d.parent.x0 + ")";
        }
        else {
          return "translate(" + source.y0 + "," + source.x0 + ")";
        }
      });
  
  nodeEnter.append("svg:text")
    .attr("x", -24)
    .attr("y", 35)
    .text(function(d) {
      var name = _.find(d.collection.items[0].data, function(property) {
        return property.name === 'name';
      });
      return name.value;
    });

  nodeEnter.append("svg:image")
    .attr("x", function(d) {return -24})
    .attr("y", -24)
    .attr("width", 48)
    .attr("height", 48)
    .attr("xlink:href", function(d) {
      var avatar = _.find(d.collection.items[0].links, function(link) {
        return link.rel == 'avatar';
      });
      return avatar.href;
    })
    .on("click", click);
      
  node.transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
    .style("opacity", 1);
    

  node.exit().transition()
    .duration(duration)
    .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
    .style("opacity", 1e-6)
    .remove();

  // Update the links…
  var link = vis.selectAll("path.link")
      .data(tree.links(nodes), function(d) { return d.target.id; });

  // Enter any new links at the parent's previous position.
  link.enter().insert("svg:path", "g")
    .attr("class", "link")
    .attr("d", function(d) {
      var o;
      if (d.target.parent) {
        o = {x: d.target.parent.x, y: d.target.parent.y};
      }
      else {
        o = {x: source.x0, y: source.y0};
      }
      return diagonal({source: o, target: o});
    })
    .transition()
    .duration(duration)
    .attr("d", diagonal);

  // Transition links to their new position.
  link.transition()
    .duration(duration)
    .attr("d", diagonal);

  // Transition exiting nodes to the parent's new position.
  link.exit().transition()
    .duration(duration)
    .attr("d", function(d) {
      var o;
      if (d.target.parent) {
        o = {x: d.target.parent.x, y: d.target.parent.y};
      }
      else {
        o = {x: source.x, y: source.y};
      }
      return diagonal({source: o, target: o});
    })
    .remove();

  // Stash the old positions for transition.
  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Toggle children on click.
function click(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  update(d);
}

function zoom() {
  vis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
};

d3.select(self.frameElement).style("height", h+"px");
