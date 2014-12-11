/** @jsx React.DOM */

(function main($document, $react, $d3) {

    "use strict";

    /**
     * @module Amelie
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/Amelie
     */
    var Amelie = $react.createClass({

        /**
         * @method componentDidMount
         * @return {void}
         */
        componentDidMount: function componentDidMount() {

            // Once the component has been rendered we can listen for the "canplay" event to setup
            // the audio context to begin analysing the audio stream.
            this.getAudioElement().addEventListener('canplay', this.configureAudioContext);

        },

        /**
         * @method getInitialState
         * @returns {Object}
         */
        getInitialState: function getInitialState() {
            return { analyser: null };
        },

        /**
         * @method getAudioElement
         * @return {HTMLElement}
         */
        getAudioElement: function getAudioElement() {
            return this.getDOMNode().querySelector('audio');
        },

        /**
         * @method configureAudioContext
         * @return {void}
         */
        configureAudioContext: function configureAudioContext() {

            // Dependencies for analysing the audio stream.
            var context  = new AudioContext() || webkitAudioContext(),
                analyser = context.createAnalyser();

            // Route the audio source through our visualiser.
            var source = context.createMediaElementSource(this.getAudioElement());
            source.connect(analyser);

            // Create the analyser object.
            analyser.connect(context.destination);
            analyser.fftSize = 128;

            // ...And now we can begin the visualisation rendering!
            this.setState({ analyser: analyser });

        },

        /**
         * @method render
         * @return {XML}
         */
        render: function render() {

            return (
                <section className="amelie">
                    <audio controls="controls" autoPlay="autoplay" src={ this.props.audio }></audio>
                    <Visualiser analyser={ this.state.analyser } />
                </section>
            );

        }

    });

    /**
     * @module Amelie
     * @submodule Visualiser
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/Amelie
     */
    var Visualiser = $react.createClass({

        /**
         * @method componentWillReceiveProps
         * @param nextProps {Object}
         * @return {void}
         */
        componentWillReceiveProps: function componentWillReceiveProps(nextProps) {

            if (nextProps.analyser) {

                // We have the `AnalyserNode` and therefore we're ready to analyse the
                // audio track.
                this.analyseAudioStream(nextProps.analyser);

            }

        },

        /**
         * @method getInitialState
         * @returns {Object}
         */
        getInitialState: function getInitialState() {
            return { cursor: { x: 0, y: 0 }, frequencyData: [] };
        },

        /**
         * @method analyseAudioStream
         * @param analyser {AnalyserNode}
         * @return {void}
         */
        analyseAudioStream: function anaylseAudioStream(analyser) {

            // Round and round we go...
            (requestAnimationFrame || webkitRequestAnimationFrame)(function() {
                anaylseAudioStream.call(this, analyser);
            }.bind(this));

            // Analyse the frequency data for the current audio track!
            var frequencyData = new Uint8Array(analyser.frequencyBinCount);

            analyser.getByteFrequencyData(frequencyData);
            //analyser.getByteTimeDomainData(frequencyData);

            // Create another circle...
            //this.renderCircles(frequencyData);
            this.setState({ frequencyData: frequencyData, fftSize: analyser.fftSize });

        },

        /**
         * @method setCursorPosition
         * @param event {Object}
         * @return {void}
         */
        setCursorPosition: function setCursorPosition(event) {
            this.setState({ cursor: { x: event.clientX, y: event.clientY } });
        },

        /**
         * @method render
         * @return {XML}
         */
        render: function render() {

            return (
                <section className="visualiser" onMouseMove={this.setCursorPosition}>
                    <Canvas frequencyData={this.state.frequencyData}
                            cursor={this.state.cursor}
                            fftSize={this.state.fftSize} />
                </section>
            );

        }

    });


    /**
     * @module Amelie
     * @submodule Canvas
     * @author Adam Timberlake
     * @link https://github.com/Wildhoney/Amelie
     */
    var Canvas = $react.createClass({

        /**
         * @method componentDidMount
         * @return {void}
         */
        componentDidMount: function componentDidMount() {

            // Configure the D3 SVG component.
            var d3Element = $d3.select(this.getDOMNode()).append('svg').attr('width', 200).attr('height', 200).append('g');
            this.setState({ d3: d3Element, colours: $d3.scale.category20b() });

        },

        /**
         * @method componentWillReceiveProps
         * @param nextProps {Object}
         * @return {void}
         */
        componentWillReceiveProps: function componentWillReceiveProps(nextProps) {

            if (this.state.circles.length === 0 && nextProps.fftSize) {

                // We know the `fftSize` and can therefore pre-render the required number of
                // circles to quicken the rendering.
                this.setState({ circles: this.createCircles(nextProps.fftSize) });

            }

        },

        /**
         * @method createCircles
         * @param amountOfCircles {Number}
         * @return {Array}
         */
        createCircles: function createCircles(amountOfCircles) {

            var circles = [];

            for (var index = 0; index < amountOfCircles; index++) {
                circles.push(this.state.d3.append('circle'));
            }

            return circles;

        },

        /**
         * @method getInitialState
         * @returns {Object}
         */
        getInitialState: function getInitialState() {
            return { circles: [], colours: function noop() {} };
        },

        /**
         * @method renderCircles
         * @param frequencyData {Uint8Array}
         * @return {void}
         */
        renderCircles: function renderCircles(frequencyData) {

            if (this.state.circles.length === 0) {

                // Circles haven't yet been pre-rendered and therefore we're unable to go
                // any further.
                return;

            }

            var colours   = this.state.colours,
                pointerX  = this.props.cursor.x,
                pointerY  = this.props.cursor.y;

            for (var index = 0, maxLength = frequencyData.length; index < maxLength; index++) {

                (function closure(circle) {

                    var currentIndex = index;

                    circle.attr('cx', function cx() { return pointerX + 50; })
                        .attr('cy', function cy() { return pointerY + 50; })
                        .attr('r', function r() { return frequencyData[currentIndex] / 7.5; })
                        .style('fill', function fill() { return colours(currentIndex); });

                })(this.state.circles[index]);

            }
        },

        /**
         * @method render
         * @return {XML}
         */
        render: function render() {

            if (this.props.frequencyData) {

                // We're ready to begin rendering the circles for this particular canvas element.
                this.renderCircles(this.props.frequencyData);

            }

            return (
                <div className="canvas-container" />
            );

        }

    });

    // It's time to throw everything to the devil and go to Kislovodsk...
    var amelieNode = $document.querySelector('amelie');
    $react.render(<Amelie audio={amelieNode.getAttribute('data-audio')} />, amelieNode);

})(window.document, window.React, window.d3);