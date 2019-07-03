module.exports = {
    client: null,
    fetchUser: function(id) {
        return this.client.fetchUser(id);
    },
    userCache: {},
    sessions: null
};