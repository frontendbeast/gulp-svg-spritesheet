.sprite:before {
    content: ' ';
    display: inline-block;
    background-image: url("{{{cssPathSvg}}}");
    background-repeat: no-repeat;
    background-size: {{width}}{{units}} {{height}}{{units}};
    {{#cssPathNoSvg}}
    .no-svg & {
        background-image: url("{{{cssPathNoSvg}}}");
    }
    {{/cssPathNoSvg}}
}

{{#sprites}}
.sprite--{{fileName}} {
    &:extend(.sprite);
    &:before{
        background-position: {{x}}{{units}} {{y}}{{units}};
        width: {{w}}{{units}};
        height: {{h}}{{units}};
    }
}
{{/sprites}}

