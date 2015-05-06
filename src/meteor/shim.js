(function(ctx, isMeteorPackage) {
    if (isMeteorPackage) {
        Holder = ctx.Holder;
    }
})(this, typeof Meteor !== 'undefined' && typeof Package !== 'undefined');
