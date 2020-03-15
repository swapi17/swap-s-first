const passport = require('passport')
const GoogleStrategy = require('passport-google-oauth20')
const mongoose = require('mongoose')
const time = require('./../libs/timeLib');


const User = mongoose.model('SocialUser')

passport.serializeUser((user, done) => {
    done(null, user.id)
})

passport.deserializeUser((id, done) => {
    User.findById(id)
        .then(user => {
            done(null, user)
        })
})

passport.use(new GoogleStrategy({
    clientID: "440060495207-4chi8q61hvlqh15nb4vq4866nc7v0d56.apps.googleusercontent.com",
    clientSecret: "pghmNahCSodHRRjYZMhMcVXH",
    callbackURL: '/auth/google/callback',
    proxy: true
}, async (accessToken, refreshToken, profile, done) => {
    for (let x of profile.emails) {
        var email = x.value
    }
    const existingUser = await User.findOne({ userId: profile.id })

    if (existingUser) {
        done(null, existingUser)
    } else {
        let newUser = await new User({
            userId: profile.id,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: email,
            createdOn: time.now()
        })

        newUser.save()
        done(null, user)

    }

})

);