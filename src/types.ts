// The data contract that flows through the seam (see ./api/sendMessage).
//
// This is what makes the seam a seam: sendMessage() promises to RETURN this
// shape, components promise to RENDER this shape, and neither side cares what's
// on the other side of the boundary. Get this right and v2 needs no component
// changes.
//
// Intentionally empty — designing this shape is the next step.
export {}
